import mongoose from "mongoose";
import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import User from "../models/user.models.js";
import ProjectMember from "../models/projectmember.models.js";
import ProjectInvite, { InviteStatusEnum } from "../models/projectinvite.models.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Find verified users by username prefix, for the invite picker.
// Emails are never returned; with projectId, each hit says whether they are
// already a member or already invited.
const searchUsers = asynchandler(async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase().replace(/^@/, "");
  const { projectId } = req.query;

  if (q.length < 2) {
    return res.status(200).json(new ApiResponse(200, "Type at least 2 characters", []));
  }

  const users = await User.find({
    userName: { $regex: `^${escapeRegex(q)}` },
    isEmailVerified: true,
  })
    .select("userName fullName avatar")
    .sort({ userName: 1 })
    .limit(8)
    .lean();

  let memberIds = new Set();
  let invitedIds = new Set();

  if (projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ApiError(400, "Invalid Project ID");
    }
    const isMember = await ProjectMember.exists({ project: projectId, user: req.user._id });
    if (!isMember) {
      throw new ApiError(403, "You are not a member of this project");
    }

    const ids = users.map((u) => u._id);
    const [members, invites] = await Promise.all([
      ProjectMember.find({ project: projectId, user: { $in: ids } }).select("user").lean(),
      ProjectInvite.find({
        project: projectId,
        invitedUser: { $in: ids },
        status: InviteStatusEnum.PENDING,
        expiresAt: { $gt: new Date() },
      })
        .select("invitedUser")
        .lean(),
    ]);
    memberIds = new Set(members.map((m) => String(m.user)));
    invitedIds = new Set(invites.map((i) => String(i.invitedUser)));
  }

  const results = users.map((u) => ({
    ...u,
    status: memberIds.has(String(u._id)) ? "member" : invitedIds.has(String(u._id)) ? "invited" : null,
  }));

  return res.status(200).json(new ApiResponse(200, "Users found", results));
});

export { searchUsers };
