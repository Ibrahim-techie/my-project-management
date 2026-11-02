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
import {
  closeProjectRoom,
  emitToProject,
  emitToUser,
  removeUserFromProject,
} from "../socket/index.js";

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

  const payload = { projectId, userId, role: projectMember.role };
  emitToProject(projectId, "member:role-updated", payload);
  emitToUser(userId, "member:role-updated", payload);

  return res.json(new ApiResponse(200, projectMember));
});

const deleteProjectMember = asynchandler(async (req, res) => {
  const { projectId, userId } = req.params;

  const projectMember = await ProjectMember.findOneAndDelete({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!projectMember) {
    throw new ApiError(404, "Project Member not found");
  }

  // Pull their sockets out of the room first so they miss this and later events
  removeUserFromProject(projectId, userId);
  emitToProject(projectId, "member:removed", { projectId, userId });

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
