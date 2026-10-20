import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
} from "../controllers/auth.controller.js";

import validateRequest from "../middlewares/validator.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
} from "../validators/index.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/register")
  .post(userRegisterValidator(), validateRequest, registerUser);

router.route("/verify-email/:token").get(verifyEmail);

router.route("/login").post(userLoginValidator(), validateRequest, loginUser);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
