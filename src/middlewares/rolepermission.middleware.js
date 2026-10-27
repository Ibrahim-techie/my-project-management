import asyncHandler from "../utils/asynchandler.js";
import ApiError from "../utils/ApiErrors.js";
import ProjectMember from "../models/projectmember.models.js";
import mongoose from "mongoose";

const roleProjectPermission = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    if (!projectId) {
      throw new ApiError(400, "Missing Project ID");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ApiError(400, "Invalid Project ID");
    }

    const projectMember = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!projectMember) {
      throw new ApiError(403, "You are not a member of this project");
    }

    const givenRole = projectMember.role;

    req.user.role = givenRole;

    if (!roles.includes(givenRole)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action",
      );
    }

    next();
  });
};

export default roleProjectPermission;
