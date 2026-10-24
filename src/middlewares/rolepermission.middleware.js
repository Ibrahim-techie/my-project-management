import asynchandler from "../utils/asynchandler.js";
import ApiError from "../utils/ApiErrors.js";
import mongoose from "mongoose";
import Project from "../models/project.models.js";

export const roleProjectPermission = (roles = []) => {
  asynchandler(async (req, res, next) => {
    const { projectId } = req.query;

    if (!projectId) {
      next(new ApiError(400, "Missing ProjectID"));
    }

    const project = await Project.findone({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!project) {
      next(new ApiError(400, "Porject Not found"));
    }

    const givenRole = project?.role;

    req.user.role = givenRole;

    if (!roles.includes(givenRole)) {
      throw new ApiError(403, "You Do not Have Permission to DO this Action");
    }

    next();
  });
};
