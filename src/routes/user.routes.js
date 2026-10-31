import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { searchUsers } from "../controllers/user.controllers.js";

const router = Router();

router.use(verifyJWT);

router.route("/search").get(searchUsers);

export default router;
