import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import SubTask from "../models/subtask.models.js";
import mongoose from "mongoose";
import Task from "../models/task.models.js";
import { AvailableTaskStatus, TaskStatusEnum, UserRolesEnum } from "../utils/constants.js";
import { emitToProject } from "../socket/index.js";
import Project from "../models/project.models.js";
import User from "../models/user.models.js";
import { sendSubtaskAddedEmail, taskLinkFor } from "./email.controller.js";

// Existence check only; nothing here needs the task document itself
const requireTaskInProject = async (projectId, taskId) => {
  const exists = await Task.exists({ _id: taskId, project: projectId });
  if (!exists) throw new ApiError(404, "Task not found in this project");
};

// Email the parent task's assignee about a new subtask. Skipped when they
// added it themselves. Runs in the background so a slow or failing mail
// provider never delays or fails the request.
const notifyTaskAssignee = ({ projectId, taskId, subtask, adder }) => {
  const taskLink = taskLinkFor(projectId, taskId);
  if (!taskLink) {
    console.error("[subtask-email] FRONTEND_URL is not configured, skipping email");
    return;
  }

  (async () => {
    const task = await Task.findById(taskId).select("title assignedTo dueDate").lean();
    const assigneeId = task?.assignedTo?.toString();
    if (!assigneeId || assigneeId === adder._id.toString()) return;

    const [assignee, project] = await Promise.all([
      User.findById(assigneeId).select("email userName fullName").lean(),
      Project.findById(projectId).select("name").lean(),
    ]);
    if (!assignee?.email) return;

    await sendSubtaskAddedEmail({
      email: assignee.email,
      userName: assignee.fullName || assignee.userName,
      taskLink,
      adderName: adder.fullName || adder.userName,
      projectName: project?.name,
      taskTitle: task.title,
      subtaskTitle: subtask.title,
      dueDate: subtask.dueDate,
      taskDueDate: task.dueDate,
    });
  })().catch((error) => {
    console.error(`[subtask-email] could not notify assignee of subtask ${subtask._id}:`, error.message);
  });
};

// Create subtask
const createSubTask = asynchandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title, status, dueDate } = req.body;

  await requireTaskInProject(projectId, taskId);

  const subtask = await SubTask.create({
    title,
    status,
    dueDate: dueDate || null,
    task: new mongoose.Types.ObjectId(taskId),
  });

  emitToProject(projectId, "subtask:created", { projectId, taskId, subtask });
  notifyTaskAssignee({ projectId, taskId, subtask, adder: req.user });

  return res
    .status(201)
    .json(new ApiResponse(201, "Subtask created successfully", subtask));
});

// Get subtasks for a task
const getSubTasks = asynchandler(async (req, res) => {
  const { taskId } = req.params;

  await requireTaskInProject(req.params.projectId, taskId);

  const subtasks = await SubTask.find({
    task: new mongoose.Types.ObjectId(taskId),
  });

  if (subtasks.length === 0) {
    return res.status(200).json(new ApiResponse(200, "No Subtask Found", []));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Subtasks fetched successfully", subtasks));
});

// Update a subtask
const updateSubTask = asynchandler(async (req, res) => {
  const { projectId, taskId, subTaskId } = req.params;
  const { title, status, dueDate } = req.body;

  await requireTaskInProject(projectId, taskId);

  const update = {
    ...(title !== undefined && { title }),
    ...(status !== undefined && { status }),
    // An empty value clears the deadline
    ...(dueDate !== undefined && { dueDate: dueDate || null }),
  };

  // If no fields provided, return current subtask or error
  if (Object.keys(update).length === 0) {
    const existing = await SubTask.findOne({
      _id: new mongoose.Types.ObjectId(subTaskId),
      task: new mongoose.Types.ObjectId(taskId),
    });
    if (!existing) throw new ApiError(404, "Subtask not found");
    return res
      .status(200)
      .json(new ApiResponse(200, "No changes provided", existing));
  }

  const subTask = await SubTask.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(subTaskId),
      task: new mongoose.Types.ObjectId(taskId),
    },
    { $set: update },
    { new: true, runValidators: true },
  );

  if (!subTask) throw new ApiError(404, "Subtask not found");

  emitToProject(projectId, "subtask:updated", { projectId, taskId, subtask: subTask });

  return res
    .status(200)
    .json(new ApiResponse(200, "Subtask updated successfully", subTask));
});

const updateSubTaskStatus = asynchandler(async (req, res) => {
  const { projectId, taskId, subTaskId } = req.params;
  const { status } = req.body;

  await requireTaskInProject(projectId, taskId);

  if (!AvailableTaskStatus.includes(status)) {
    throw new ApiError(400, "Status is not valid");
  }

  if (req.user.role === UserRolesEnum.MEMBER && status !== TaskStatusEnum.DONE) {
    throw new ApiError(403, "Members can only mark subtasks as done");
  }

  const subTask = await SubTask.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(subTaskId),
      task: new mongoose.Types.ObjectId(taskId),
    },

    {
      $set: {
        status,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!subTask) throw new ApiError(404, "Subtask not found");

  emitToProject(projectId, "subtask:updated", { projectId, taskId, subtask: subTask });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Subtask Status  updated successfully", subTask),
    );
});

// Delete a subtask
const deleteSubTask = asynchandler(async (req, res) => {
  const { projectId, taskId, subTaskId } = req.params;

  await requireTaskInProject(projectId, taskId);

  const deleted = await SubTask.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(subTaskId),
    task: new mongoose.Types.ObjectId(taskId),
  });

  if (!deleted) throw new ApiError(404, "Subtask not found");

  emitToProject(projectId, "subtask:deleted", { projectId, taskId, subTaskId: deleted._id });

  return res
    .status(200)
    .json(new ApiResponse(200, "Subtask deleted successfully"));
});

export {
  createSubTask,
  getSubTasks,
  updateSubTask,
  deleteSubTask,
  updateSubTaskStatus,
};
