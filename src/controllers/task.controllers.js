import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import Task from "../models/task.models.js";
import Project from "../models/project.models.js";
import ProjectMember from "../models/projectmember.models.js";
import mongoose from "mongoose";

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

  const { title, description, assignedTo, status } = req.body;

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
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
    attachments: attachements,
  });

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
  const { title, description, assignedTo, status } = req.body;

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
      },
      ...(attachements.length > 0 && { $push: { attachments: { $each: attachements } } }),
    },
    { new: true },
  );

  if (!task) {
    throw new ApiError(400, "No Task Found");
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
