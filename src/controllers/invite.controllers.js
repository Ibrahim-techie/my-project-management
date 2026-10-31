import mongoose from "mongoose";
import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import Project from "../models/project.models.js";
import ProjectMember from "../models/projectmember.models.js";
import User from "../models/user.models.js";
import ProjectInvite, { InviteStatusEnum, hashInviteToken } from "../models/projectinvite.models.js";
import { sendProjectInviteEmail } from "./email.controller.js";

const PUBLIC_USER_FIELDS = "userName fullName avatar";

const inviteLinkFor = (token) => {
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");
  if (!frontendUrl) {
    throw new ApiError(500, "FRONTEND_URL is not configured");
  }
  return `${frontendUrl}/invites/${token}`;
};

// Emails the invite; local runs also log the link so it can be opened without a mailbox
const deliverInvite = async ({ invite, token, project, invitee, inviter }) => {
  const inviteLink = inviteLinkFor(token);
  if (process.env.NODE_ENV !== "production") {
    console.log(`[invite] ${invitee.userName} -> ${project.name}: ${inviteLink}`);
  }
  await sendProjectInviteEmail({
    email: invitee.email,
    userName: invitee.userName,
    inviteLink,
    inviterName: inviter.fullName || inviter.userName,
    projectName: project.name,
  });
  return invite;
};

const withExpiry = (invite) => ({
  ...invite,
  expired: new Date(invite.expiresAt).getTime() < Date.now(),
});

// ---------- admin side ----------

// POST /project/:projectId/members: invite a verified user, by id (or email/username as a fallback)
const createInvite = asynchandler(async (req, res) => {
  const { projectId } = req.params;
  const { userId, email, username, role } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const invitee = await User.findOne(
    userId
      ? { _id: userId }
      : email
        ? { email: email.toLowerCase() }
        : { userName: String(username).toLowerCase() },
  );
  if (!invitee) throw new ApiError(404, "User does not exist");
  if (!invitee.isEmailVerified) {
    throw new ApiError(400, "This user has not verified their email yet, so they cannot be invited");
  }

  if (await ProjectMember.exists({ project: projectId, user: invitee._id })) {
    throw new ApiError(409, `@${invitee.userName} is already a member of this project`);
  }

  // a stale pending invite (expired) is replaced rather than blocking a new one
  const existing = await ProjectInvite.findOne({
    project: projectId,
    invitedUser: invitee._id,
    status: InviteStatusEnum.PENDING,
  });
  if (existing && !existing.isExpired()) {
    throw new ApiError(409, `@${invitee.userName} already has a pending invite`);
  }
  if (existing) {
    existing.status = InviteStatusEnum.REVOKED;
    await existing.save();
  }

  const invite = new ProjectInvite({
    project: project._id,
    invitedUser: invitee._id,
    invitedBy: req.user._id,
    role,
  });
  const token = invite.issueToken();
  await invite.save();

  try {
    await deliverInvite({ invite, token, project, invitee, inviter: req.user });
  } catch (error) {
    await ProjectInvite.deleteOne({ _id: invite._id });
    console.error("Invite email failed; the invite was removed:", error);
    throw new ApiError(502, "The invite email could not be sent. Please try again.");
  }

  const created = await ProjectInvite.findById(invite._id)
    .select("-tokenHash")
    .populate("invitedUser", PUBLIC_USER_FIELDS)
    .lean();

  return res
    .status(201)
    .json(new ApiResponse(201, `Invite sent to @${invitee.userName}`, withExpiry(created)));
});

// GET /project/:projectId/invites: pending invites, expired ones flagged
const listProjectInvites = asynchandler(async (req, res) => {
  const invites = await ProjectInvite.find({
    project: req.params.projectId,
    status: InviteStatusEnum.PENDING,
  })
    .select("-tokenHash")
    .populate("invitedUser", PUBLIC_USER_FIELDS)
    .populate("invitedBy", PUBLIC_USER_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Pending invites fetched", invites.map(withExpiry)));
});

const findPendingProjectInvite = async (projectId, inviteId) => {
  if (!mongoose.Types.ObjectId.isValid(inviteId)) throw new ApiError(400, "Invalid invite ID");
  const invite = await ProjectInvite.findOne({
    _id: inviteId,
    project: projectId,
    status: InviteStatusEnum.PENDING,
  });
  if (!invite) throw new ApiError(404, "Invite not found or already answered");
  return invite;
};

// POST /project/:projectId/invites/:inviteId/resend: new link, expiry reset
const resendInvite = asynchandler(async (req, res) => {
  const { projectId, inviteId } = req.params;
  const invite = await findPendingProjectInvite(projectId, inviteId);
  const [project, invitee] = await Promise.all([
    Project.findById(projectId),
    User.findById(invite.invitedUser),
  ]);
  if (!invitee) throw new ApiError(404, "The invited user no longer exists");

  const token = invite.issueToken();
  await invite.save();

  try {
    await deliverInvite({ invite, token, project, invitee, inviter: req.user });
  } catch (error) {
    console.error("Invite resend failed:", error);
    throw new ApiError(502, "The invite email could not be sent. Please try again.");
  }

  return res.status(200).json(new ApiResponse(200, `Invite resent to @${invitee.userName}`, {}));
});

// DELETE /project/:projectId/invites/:inviteId: cancel; the link stops working
const revokeInvite = asynchandler(async (req, res) => {
  const { projectId, inviteId } = req.params;
  const invite = await findPendingProjectInvite(projectId, inviteId);
  invite.status = InviteStatusEnum.REVOKED;
  invite.respondedAt = new Date();
  await invite.save();
  return res.status(200).json(new ApiResponse(200, "Invite cancelled", {}));
});

// ---------- invitee side ----------

const describe = async (invite) => {
  const populated = await ProjectInvite.findById(invite._id)
    .select("-tokenHash")
    .populate("project", "name description")
    .populate("invitedBy", PUBLIC_USER_FIELDS)
    .populate("invitedUser", PUBLIC_USER_FIELDS)
    .lean();
  return withExpiry(populated);
};

// Throws the right error for an invite the current user cannot act on
const assertActionable = (invite, user) => {
  if (!invite) throw new ApiError(404, "This invite link is not valid");
  if (String(invite.invitedUser) !== String(user._id)) {
    throw new ApiError(403, "This invite was sent to a different account", [{ reason: "wrong_account" }]);
  }
  if (invite.status === InviteStatusEnum.ACCEPTED || invite.status === InviteStatusEnum.DECLINED) {
    throw new ApiError(410, `You already ${invite.status} this invite`, [{ reason: invite.status }]);
  }
  // an expired invite that was later replaced is still best explained as expired
  if (invite.isExpired()) {
    throw new ApiError(410, "This invite has expired. Ask a project admin to send a new one.", [{ reason: "expired" }]);
  }
  if (invite.status === InviteStatusEnum.REVOKED) {
    throw new ApiError(410, "This invite was cancelled by a project admin", [{ reason: "revoked" }]);
  }
};

const respond = async (invite, user, accept) => {
  assertActionable(invite, user);

  let projectId = null;
  if (accept) {
    const project = await Project.findById(invite.project).select("_id");
    if (!project) throw new ApiError(410, "This project no longer exists", [{ reason: "gone" }]);
    // upsert keeps accept idempotent if they somehow joined already
    await ProjectMember.findOneAndUpdate(
      { project: invite.project, user: user._id },
      { $setOnInsert: { project: invite.project, user: user._id, role: invite.role } },
      { upsert: true },
    );
    projectId = project._id;
  }

  invite.status = accept ? InviteStatusEnum.ACCEPTED : InviteStatusEnum.DECLINED;
  invite.respondedAt = new Date();
  await invite.save();
  return projectId;
};

const byToken = (token) => ProjectInvite.findOne({ tokenHash: hashInviteToken(String(token)) });

const byId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid invite ID");
  return ProjectInvite.findById(id);
};

// GET /invites: my live invites, for the dashboard
const listMyInvites = asynchandler(async (req, res) => {
  const invites = await ProjectInvite.find({
    invitedUser: req.user._id,
    status: InviteStatusEnum.PENDING,
    expiresAt: { $gt: new Date() },
  })
    .select("-tokenHash")
    .populate("project", "name description")
    .populate("invitedBy", PUBLIC_USER_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Invites fetched", invites.filter((i) => i.project)));
});

// GET /invites/:token: what the landing page shows
const getInviteByToken = asynchandler(async (req, res) => {
  const invite = await byToken(req.params.token);
  if (!invite) throw new ApiError(404, "This invite link is not valid");
  if (String(invite.invitedUser) !== String(req.user._id)) {
    const intended = await User.findById(invite.invitedUser).select("userName");
    throw new ApiError(403, `This invite was sent to @${intended?.userName || "another user"}`, [
      { reason: "wrong_account", userName: intended?.userName },
    ]);
  }
  return res.status(200).json(new ApiResponse(200, "Invite fetched", await describe(invite)));
});

const respondHandler = (find, accept) =>
  asynchandler(async (req, res) => {
    const invite = await find(req.params.token ?? req.params.inviteId);
    const projectId = await respond(invite, req.user, accept);
    return res
      .status(200)
      .json(
        new ApiResponse(200, accept ? "You joined the project" : "Invite declined", { projectId }),
      );
  });

const acceptInviteByToken = respondHandler(byToken, true);
const declineInviteByToken = respondHandler(byToken, false);
const acceptInviteById = respondHandler(byId, true);
const declineInviteById = respondHandler(byId, false);

export {
  createInvite,
  listProjectInvites,
  resendInvite,
  revokeInvite,
  listMyInvites,
  getInviteByToken,
  acceptInviteByToken,
  declineInviteByToken,
  acceptInviteById,
  declineInviteById,
};
