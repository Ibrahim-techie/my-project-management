import Project from "../models/project.models.js";
import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import ProjectMember from "../models/projectmember.models";
import mongoose from "mongoose";
import { AvailableTaskStatus, UserRolesEnum } from "../utils/constants.js";
import User from "../models/user.models.js";

const getProjects = asynchandler(async (req, res) => {
  //aggregtion pipeline
  const projects = await ProjectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "projects",
        pipeline: [
          {
            $lookup: {
              from: "projectmember",
              localField: "_id",
              foreignField: "project",
              as: "projectmembers",
            },
          },

          {
            $addFields: {
              members: {
                $size: "projectmembers",
              },
            },
          },
          {
            $unwind: "project",
          },

          {
            $project: {
              project: {
                _id: 1,
                name: 1,
                description: 1,
                members: 1,
                createdAt: 1,
                createdBy: 1,
              },
              role: {
                _id: 0,
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "Projects fetched SuccessFully", projects));
});

const getProjectbyId = asynchandler(async (req, res) => {
  const { projectId } = req.body;

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

  return res.status(200).json(200, "Project Updated Successfully", project);
});

const deleteProjectById = asynchandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findByIdAndDelete(projectId);

  if (!project) {
    throw new ApiError(404, "project not found");
  }

  return res.status(204).json(204, "Project Deleted Successfully");
});

const listProjectMembers = asynchandler(async (req, res) => {
  const { projectId } = req.body;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project Not found");
  }

  const projectmemebers = await ProjectMember.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
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
    {},
  ]);
});

const addMemberToProject = asynchandler(async (req, res) => {
  const { email, projectId, role, username } = req.body;

  if(!email && !username){
    throw new ApiError(404,"No user is Given to ADD to Project")
  }
  const key = email || username; // either username or email

  
  const user = await User.findOne({
    key,
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  await ProjectMember.findByIdAndUpdate(
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
    },
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
      role: role,
    },
    {
      new: true,
      upsert: true,
    },
  );

  return res.status(201).json(201, "Project Memeber Added Successfully");
});

const updateProjectMemberRoles = asynchandler(async (req, res) => {
  const { projectId, userId } = req.query;
  const { newRole } = req.body;

  if (!AvailableTaskStatus.includes(newRole)) {
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

  return res.json(new ApiResponse(200, projectMember));
});

const deleteProjectMember = asynchandler(async (req, res) => {
  const { projectId, userId } = req.query;

  const projectMember = await ProjectMember.findOneAndDelete({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!projectMember) {
    throw new ApiError(404, "Project Member not found");
  }

  return res
    .status(200) 
    .json(new ApiResponse(200, "Project Member Deleted Successfully"));
});


export {
  addMemberToProject,
  createProject,
  deleteProjectById,
  listProjectMembers,
  updateProjectDetails,
  updateProjectMemberRoles,
  deleteProjectMember,
  getProjects,
};
