import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  acceptInviteById,
  acceptInviteByToken,
  declineInviteById,
  declineInviteByToken,
  getInviteByToken,
  listMyInvites,
} from "../controllers/invite.controllers.js";

const router = Router();

// every invite action needs the invited user signed in
router.use(verifyJWT);

router.route("/").get(listMyInvites);

// in-app buttons, keyed by invite id
router.route("/id/:inviteId/accept").post(acceptInviteById);
router.route("/id/:inviteId/decline").post(declineInviteById);

// the emailed link, keyed by token
router.route("/:token").get(getInviteByToken);
router.route("/:token/accept").post(acceptInviteByToken);
router.route("/:token/decline").post(declineInviteByToken);

export default router;
