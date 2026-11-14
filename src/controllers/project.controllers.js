import { randomUUID } from "node:crypto";
import Project from "../models/project.models.js";
import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import ProjectMember from "../models/projectmember.models.js";
import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";
import Task from "../models/task.models.js";
import SubTask from "../models/subtask.models.js";
import Note from "../models/note.model.js";
import ProjectInvite from "../models/projectinvite.models.js";
import { releaseMemberLock, tryAcquireMemberLock } from "../models/projectmemberlock.models.js";
import User from "../models/user.models.js";
import {
  appLinkFor,
  nameOf,
  sendInBackground,
  sendMemberRemovedEmail,
  sendMemberRoleChangedEmail,
  sendProjectDeletedEmail,
  taskLinkFor,
} from "./email.controller.js";
import {
  closeProjectRoom,
  emitToProject,
  emitToUser,
  removeUserFromProject,
} from "../socket/index.js";

// ---------- last-admin protection ----------
//
// Only admins can manage members and invites or edit and delete the project;
// project admins are limited to tasks (see routes/project.route.js). So every
// project must keep at least one admin, and the two ways to lose one, removing
// a member and changing a role, run their checks and their write inside
// withMemberLock, where no other such change to the project can interleave.

const MEMBER_LOCK_WAIT_MS = 5_000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs `fn` holding the project's member lock, waiting briefly for a concurrent change to finish */
const withMemberLock = async (projectId, fn) => {
  const token = randomUUID();
  const giveUpAt = Date.now() + MEMBER_LOCK_WAIT_MS;
  while (!(await tryAcquireMemberLock(projectId, token))) {
    if (Date.now() >= giveUpAt) {
      throw new ApiError(409, "Another change to this project's members is in progress. Please try again.");
    }
    await sleep(25 + Math.random() * 75);
  }
  try {
    return await fn();
  } finally {
    await releaseMemberLock(projectId, token).catch((error) => {
      // the lease runs out on its own and the next request takes it over
      console.error(`[members] could not release the member lock of project ${projectId}:`, error.message);
    });
  }
};

const assertValidUserId = (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid User ID");
};

// roleProjectPermission checked the caller before the lock was taken, and a
// concurrent request may have removed or demoted them since. Same rules and
// messages as the middleware.
const assertCallerIsAdmin = async (projectId, callerId) => {
  const caller = await ProjectMember.findOne({ project: projectId, user: callerId }).select("role").lean();
  if (!caller) throw new ApiError(403, "You are not a member of this project");
  if (caller.role !== UserRolesEnum.ADMIN) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
};

const assertNotLastAdmin = async (projectId, userId, action) => {
  const anotherAdmin = await ProjectMember.exists({
    project: projectId,
    user: { $ne: userId },
    role: UserRolesEnum.ADMIN,
  });
  if (!anotherAdmin) {
    throw new ApiError(
      400,
      `You can't ${action} the project's only admin. Make another member an admin first.`,
      [{ reason: "last_admin" }],
    );
  }
};

const getProjects = asynchandler(async (req, res) => {
  const projects = await ProjectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: Project.collection.name,
        localField: "project",
        foreignField: "_id",
        as: "project",
      },
    },
    { $unwind: "$project" },
    {
      $lookup: {
        from: ProjectMember.collection.name,
        localField: "project._id",
        foreignField: "project",
        as: "projectMemberDocs",
      },
    },
    {
      $addFields: {
        "project.members": { $size: "$projectMemberDocs" },
      },
    },
    { $project: { projectMemberDocs: 0 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "Projects fetched SuccessFully", projects));
});

const getProjectbyId = asynchandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project Not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Project Fetched Successfully", project));
});

//secured after login
const createProject = asynchandler(async (req, res) => {
  const { name, description } = req.body;

  const project = await Project.create({
    name,
    description,
    createdBy: new mongoose.Types.ObjectId(req.user?._id),
  });

  await ProjectMember.create({
    user: new mongoose.Types.ObjectId(req.user?._id),
    project: new mongoose.Types.ObjectId(project?._id),
    role: UserRolesEnum.ADMIN,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Project is Successfully is created ", project));
});

const updateProjectDetails = asynchandler(async (req, res) => {
  const { name, description } = req.body;
  const { projectId } = req.params;

  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      name,
      description,
    },
    { new: true },
  );

  if (!project) {
    throw new ApiError(404, "project not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Project Updated Successfully", project));
});

const deleteProjectById = asynchandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findByIdAndDelete(projectId);

  if (!project) {
    throw new ApiError(404, "project not found");
  }

  // Read the members before their memberships go, to tell them afterwards
  const memberIds = await ProjectMember.find({ project: project._id }).distinct("user");

  // Remove everything that hangs off the project, otherwise leftover
  // memberships keep granting access to its tasks and notes.
  const taskIds = await Task.find({ project: project._id }).distinct("_id");
  await Promise.all([
    SubTask.deleteMany({ task: { $in: taskIds } }),
    Task.deleteMany({ project: project._id }),
    Note.deleteMany({ project: project._id }),
    ProjectMember.deleteMany({ project: project._id }),
    ProjectInvite.deleteMany({ project: project._id }),
  ]);

  closeProjectRoom(project._id);

  const others = memberIds.filter((id) => String(id) !== String(req.user._id));
  if (others.length > 0) {
    sendInBackground(`project ${project._id} deleted`, async () => {
      const people = await User.find({ _id: { $in: others } }).select("email userName fullName");
      // one failed address does not stop the rest
      const results = await Promise.allSettled(
        people
          .filter((p) => p.email)
          .map((p) =>
            sendProjectDeletedEmail({
              email: p.email,
              userName: nameOf(p),
              projectName: project.name,
              deleterName: nameOf(req.user),
              appLink: appLinkFor("/"),
            }),
          ),
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length) throw new Error(`${failed.length} of ${results.length} emails failed: ${failed[0].reason?.message}`);
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Project Deleted Successfully", { projectId: project._id }));
});

const listProjectMembers = asynchandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project Not found");
  }

  const projectMembers = await ProjectMember.find({ project: projectId })
    .select("user role createdAt")
    .populate("user", "userName fullName avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Project members fetched successfully",
        projectMembers,
      ),
    );
});

const updateProjectMemberRoles = asynchandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { newRole } = req.body;

  if (!AvailableUserRole.includes(newRole)) {
    throw new ApiError(400, "Invalid ROle");
  }
  assertValidUserId(userId);

  const { before, projectMember } = await withMemberLock(projectId, async () => {
    await assertCallerIsAdmin(projectId, req.user._id);

    // only an actual change is worth an email
    const before = await ProjectMember.findOne({ project: projectId, user: userId }).select("role").lean();
    if (!before) {
      throw new ApiError(404, "Project Member not found");
    }

    if (before.role === UserRolesEnum.ADMIN && newRole !== UserRolesEnum.ADMIN) {
      await assertNotLastAdmin(projectId, userId, "demote");
    }

    const projectMember = await ProjectMember.findOneAndUpdate(
      {
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId),
      },
      { role: newRole },
      { new: true }, // returns the updated document
    );

    if (!projectMember) {
      throw new ApiError(404, "Project Member not found");
    }
    return { before, projectMember };
  });

  const payload = { projectId, userId, role: projectMember.role };
  emitToProject(projectId, "member:role-updated", payload);
  emitToUser(userId, "member:role-updated", payload);

  if (before?.role !== projectMember.role && String(userId) !== String(req.user._id)) {
    sendInBackground(`role change for ${userId} in ${projectId}`, async () => {
      const [member, project] = await Promise.all([
        User.findById(userId).select("email userName fullName"),
        Project.findById(projectId).select("name"),
      ]);
      if (!member?.email || !project) return;
      await sendMemberRoleChangedEmail({
        email: member.email,
        userName: nameOf(member),
        projectName: project.name,
        role: projectMember.role,
        changerName: nameOf(req.user),
        projectLink: taskLinkFor(projectId),
      });
    });
  }

  return res.json(new ApiResponse(200, projectMember));
});

const deleteProjectMember = asynchandler(async (req, res) => {
  const { projectId, userId } = req.params;
  assertValidUserId(userId);

  await withMemberLock(projectId, async () => {
    await assertCallerIsAdmin(projectId, req.user._id);

    const member = await ProjectMember.findOne({ project: projectId, user: userId }).select("role").lean();
    if (!member) {
      throw new ApiError(404, "Project Member not found");
    }

    if (member.role === UserRolesEnum.ADMIN) {
      await assertNotLastAdmin(projectId, userId, "remove");
    }

    const projectMember = await ProjectMember.findOneAndDelete({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!projectMember) {
      throw new ApiError(404, "Project Member not found");
    }
  });

  // Pull their sockets out of the room first so they miss this and later events
  removeUserFromProject(projectId, userId);
  emitToProject(projectId, "member:removed", { projectId, userId });

  if (String(userId) !== String(req.user._id)) {
    sendInBackground(`removal of ${userId} from ${projectId}`, async () => {
      const [member, project] = await Promise.all([
        User.findById(userId).select("email userName fullName"),
        Project.findById(projectId).select("name"),
      ]);
      if (!member?.email || !project) return;
      await sendMemberRemovedEmail({
        email: member.email,
        userName: nameOf(member),
        projectName: project.name,
        removerName: nameOf(req.user),
        appLink: appLinkFor("/"),
      });
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Project Member Deleted Successfully"));
});

export {
  createProject,
  deleteProjectById,
  listProjectMembers,
  updateProjectDetails,
  updateProjectMemberRoles,
  deleteProjectMember,
  getProjects,
  getProjectbyId,
};
