import { Router } from "express";
import {
  LoginUser,
  registerUser,
  verifyEmail,
} from "../controllers/auth.controller.js";

import validateRequest from "../middlewares/validator.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
} from "../validators/index.js";

const router = Router();

router
  .route("/register")
  .post(userRegisterValidator(), validateRequest, registerUser);

router.route("/verify-email/:token").get(verifyEmail);

router.route("/login").post(userLoginValidator(), validateRequest, LoginUser);

export default router;
