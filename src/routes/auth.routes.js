import { Router } from "express";
import {
  changeOldPassword,
  forgotPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgotPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";

import validateRequest from "../middlewares/validator.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
  userforgotPasswordValidator,
  userResetPasswordValidator,
  userChangeCurrentPasswordValidator,
} from "../validators/index.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/register")
  .post(userRegisterValidator(), validateRequest, registerUser);

router.route("/login").post(userLoginValidator(), validateRequest, loginUser);

router.route("/verify-email/:token").get(verifyEmail);

router.route("/refresh-token").post(refreshAccessToken);

router
  .route("/forgot-password")
  .post(userforgotPasswordValidator(), validateRequest, forgotPassword);

router
  .route("/reset-password")
  .post(userResetPasswordValidator(), validateRequest, resetForgotPassword);

//secures routes requires JWT AT
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT,userChangeCurrentPasswordValidator(),validateRequest, changeOldPassword);
router.route("/resend-email-verification").post(verifyJWT,resendEmailVerification);


export default router;
