import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import SubTask from "../models/subtask.models.js";
import mongoose from "mongoose";
import Task from "../models/task.models.js";
import { AvailableTaskStatus, TaskStatusEnum, UserRolesEnum } from "../utils/constants.js";

const requireTaskInProject = async (projectId, taskId) => {
  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new ApiError(404, "Task not found in this project");
  return task;
};

// Create subtask
const createSubTask = asynchandler(async (req, res) => {
  const { taskId } = req.params;
  const { title, status } = req.body;

  await requireTaskInProject(req.params.projectId, taskId);

  const subtask = await SubTask.create({
    title,
    status,
    task: new mongoose.Types.ObjectId(taskId),
  });

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
  const { taskId, subTaskId } = req.params;
  const { title, status } = req.body;

  await requireTaskInProject(req.params.projectId, taskId);

  const update = {
    ...(title !== undefined && { title }),
    ...(status !== undefined && { status }),
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
