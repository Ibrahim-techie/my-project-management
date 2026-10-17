import {Router} from "express";
import {registerUser, verifyEmail} from "../controllers/auth.controller.js"

import validateRequest  from "../middlewares/validator.middleware.js"
import userRegisterValidator  from "../validators/index.js"
const router = Router();

router.route("/register").post(userRegisterValidator(),validateRequest,registerUser);
router.route("/verify-email/:token").get(verifyEmail);

export default router;
