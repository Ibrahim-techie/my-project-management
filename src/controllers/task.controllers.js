import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import Task from "../models/task.models.js";
import Project from "../models/project.models.js";
import ProjectMember from "../models/projectmember.models.js";
import mongoose from "mongoose";
import SubTask from "../models/subtask.models.js";
import User from "../models/user.models.js";
import { emitToProject, emitToUser } from "../socket/index.js";
import { sendTaskAssignedEmail } from "./email.controller.js";

const taskLinkFor = (projectId) => {
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");
  return frontendUrl ? `${frontendUrl}/projects/${projectId}` : null;
};

// Socket ping + email to the new assignee. Skipped when someone assigns a task
// to themselves. The email runs in the background, so a slow or failing mail
// provider never delays or fails the admin's request.
const notifyAssignee = ({ task, projectId, projectName, assigner }) => {
  const assigneeId = task.assignedTo?.toString();
  if (!assigneeId || assigneeId === assigner._id.toString()) return;

  emitToUser(assigneeId, "task:assigned", { projectId, task });

  const taskLink = taskLinkFor(projectId);
  if (!taskLink) {
    console.error("[task-email] FRONTEND_URL is not configured, skipping email");
    return;
  }

  (async () => {
    const assignee = await User.findById(assigneeId).select("email userName fullName");
    if (!assignee?.email) return;
    await sendTaskAssignedEmail({
      email: assignee.email,
      userName: assignee.fullName || assignee.userName,
      taskLink,
      assignerName: assigner.fullName || assigner.userName,
      projectName,
      taskTitle: task.title,
      description: task.description,
    });
  })().catch((error) => {
    console.error(`[task-email] could not notify assignee of task ${task._id}:`, error.message);
  });
};

const getTasks = asynchandler(async (req, res) => {
  const { projectId } = req.params;

  const tasks = await Task.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate(
    "assignedTo",
    "-password -refreshToken -tokenVersion -forgotPasswordToken -forgotPasswordtokenExpiry -emailVerificationToken -emailVerificationtokenExpiry -__v",
  );

  if (!tasks || tasks.length === 0) {
   return res
      .status(200)
      .json(new ApiResponse(200, "No Task Found for this project"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Tasks fetched Successfully", tasks));
});

const getAssignedTasks = asynchandler(async (req, res) => {
  const { projectId, userId } = req.params;

  if (!projectId || !userId) {
    throw new ApiError(400, "Either ProjectId or UserId is missing");
  }

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const userTasks = await Task.find({
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: new mongoose.Types.ObjectId(userId),
  });

  if (!userTasks || userTasks.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, "No Task Found for this project"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Tasks fetched successfully", userTasks));
});

const createTask = asynchandler(async (req, res) => {
  const { projectId } = req.params;

  const { title, description, assignedTo, status, dueDate } = req.body;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const assigneeId = assignedTo || req.user._id;
  const assigneeIsMember = await ProjectMember.exists({ project: projectId, user: assigneeId });
  if (!assigneeIsMember) {
    throw new ApiError(400, "Assignee must be a member of this project");
  }

  const files = req.files || [];

  const attachements = files.map((file) => {
    return {
      url: file.path,
      publicId: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  });

  //by default assignedTo the creator of Task
  const task = await Task.create({
    title,
    description,
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: new mongoose.Types.ObjectId(assigneeId),
    status,
    dueDate: dueDate || null,
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
    attachments: attachements,
  });

  emitToProject(projectId, "task:created", task);
  notifyAssignee({ task, projectId, projectName: project.name, assigner: req.user });

  return res
    .status(201)
    .json(new ApiResponse(201, "Task has Created Successfully", task));
});

const getTaskById = asynchandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  const task = await Task.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: {
              _id: 1,
              userName: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);

  if (!task || task.length === 0) {
    throw new ApiError(404, "Task not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Task fetched successfully", task[0]));
});

const updateTask = asynchandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title, description, assignedTo, status, dueDate } = req.body;

  const files = req.files || [];

  const attachements = files.map((file) => ({
    url: file.path,
    publicId: file.filename,
    mimetype: file.mimetype,
    size: file.size,
  }));

  if (assignedTo) {
    const assigneeIsMember = await ProjectMember.exists({ project: projectId, user: assignedTo });
    if (!assigneeIsMember) {
      throw new ApiError(400, "Assignee must be a member of this project");
    }
  }

  // The previous assignee only matters when the assignee may change
  let previousAssignee = null;
  if (assignedTo) {
    const previous = await Task.findOne(
      {
        project: new mongoose.Types.ObjectId(projectId),
        _id: new mongoose.Types.ObjectId(taskId),
      },
      { assignedTo: 1 },
    ).lean();

    if (!previous) {
      throw new ApiError(400, "No Task Found");
    }
    previousAssignee = previous.assignedTo?.toString();
  }

  const task = await Task.findOneAndUpdate(
    {
      project: new mongoose.Types.ObjectId(projectId),
      _id: new mongoose.Types.ObjectId(taskId),
    },
    {
      $set: {
        ...(title && { title }),
        ...(description && { description }),
        ...(assignedTo && { assignedTo }),
        ...(status && { status }),
        // An empty value clears the deadline
        ...(dueDate !== undefined && { dueDate: dueDate || null }),
      },
      ...(attachements.length > 0 && { $push: { attachments: { $each: attachements } } }),
    },
    { new: true },
  );

  if (!task) {
    throw new ApiError(400, "No Task Found");
  }

  emitToProject(projectId, "task:updated", task);
  if (assignedTo && task.assignedTo?.toString() !== previousAssignee) {
    const project = await Project.findById(projectId).select("name").lean();
    notifyAssignee({ task, projectId, projectName: project?.name, assigner: req.user });
  }

  res.status(200).json(new ApiResponse(200, "Task updated successfully", task));
});

const deleteTask = asynchandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  const del = await Task.findOneAndDelete({
    project: new mongoose.Types.ObjectId(projectId),
    _id: new mongoose.Types.ObjectId(taskId),
  });

  if (!del) {
    throw new ApiError(400, "Task Not Found");
  }

  await SubTask.deleteMany({ task: del._id });

  emitToProject(projectId, "task:deleted", { projectId, taskId: del._id });

  return res
    .status(200)
    .json(new ApiResponse(200, "Task Deleted Successfully", del));
});

export {
  createTask,
  getTaskById,
  getTasks,
  deleteTask,
  updateTask,
  getAssignedTasks,
};
