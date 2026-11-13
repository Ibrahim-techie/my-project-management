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
  userResendVerificationValidator,
  userChangeCurrentPasswordValidator,
} from "../validators/index.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { listOAuthProviders, oauthCallback, startOAuth } from "../controllers/oauth.controller.js";

const router = Router();

router
  .route("/register")
  .post(userRegisterValidator(), validateRequest, registerUser);

router.route("/login").post(userLoginValidator(), validateRequest, loginUser);

// Sign in with Google or GitHub; see controllers/oauth.controller.js
router.route("/oauth/providers").get(listOAuthProviders);
router.route("/oauth/:provider").get(startOAuth);
router.route("/oauth/:provider/callback").get(oauthCallback);

router.route("/verify-email/:token").get(verifyEmail);

router.route("/refresh-token").post(refreshAccessToken);

router
  .route("/resend-email-verification")
  .post(userResendVerificationValidator(), validateRequest, resendEmailVerification);

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


export default router;
