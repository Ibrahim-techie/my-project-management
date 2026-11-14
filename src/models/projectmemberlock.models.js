import { Schema, model } from "mongoose";

/*
 * A short lease on one project's member list, keyed by the project id.
 *
 * Removing a member or changing a role holds it, so two such changes to the
 * same project run one after the other. Without it, two admins removing or
 * demoting each other at the same moment could each still see the other as
 * "another admin" and both succeed, leaving the project with no admin.
 *
 * It needs no transaction, so it works on a standalone MongoDB as well as on
 * a replica set.
 */
export const MEMBER_LOCK_LEASE_MS = 15_000;

const projectMemberLockSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, ref: "Project" },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

// A lease left behind by a crashed request is taken over once it expires;
// Mongo's TTL monitor clears the ones nobody takes over
projectMemberLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ProjectMemberLock = model("ProjectMemberLock", projectMemberLockSchema);

/**
 * Takes the lease for `token` when it is free or expired. Returns false while
 * another request holds it: the filter then matches nothing, and the upsert's
 * insert collides with the held document's _id.
 */
export const tryAcquireMemberLock = async (projectId, token) => {
  const now = new Date();
  try {
    await ProjectMemberLock.updateOne(
      { _id: projectId, expiresAt: { $lte: now } },
      { $set: { token, expiresAt: new Date(now.getTime() + MEMBER_LOCK_LEASE_MS) } },
      { upsert: true },
    );
    return true;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
};

/** Gives the lease back, but only if `token` still holds it */
export const releaseMemberLock = (projectId, token) =>
  ProjectMemberLock.deleteOne({ _id: projectId, token });

export default ProjectMemberLock;
