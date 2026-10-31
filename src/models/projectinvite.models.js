import { Schema, model } from "mongoose";
import crypto from "crypto";
import ms from "ms";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

export const InviteStatusEnum = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  REVOKED: "revoked",
};

export const INVITE_TTL = "7d";

const projectInviteSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    invitedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: AvailableUserRole,
      default: UserRolesEnum.MEMBER,
    },
    // only the sha256 of the emailed token is stored
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(InviteStatusEnum),
      default: InviteStatusEnum.PENDING,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    respondedAt: Date,
  },
  { timestamps: true },
);

// at most one live invite per person per project
projectInviteSchema.index(
  { project: 1, invitedUser: 1 },
  { unique: true, partialFilterExpression: { status: InviteStatusEnum.PENDING } },
);

projectInviteSchema.methods.isExpired = function () {
  return this.expiresAt.getTime() < Date.now();
};

// Returns the raw token for the email and stores its hash with a fresh expiry
projectInviteSchema.methods.issueToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.tokenHash = hashInviteToken(token);
  this.expiresAt = new Date(Date.now() + ms(INVITE_TTL));
  return token;
};

export const hashInviteToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const ProjectInvite = model("ProjectInvite", projectInviteSchema);
export default ProjectInvite;
