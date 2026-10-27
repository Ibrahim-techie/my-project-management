import { Router } from "express";

import {
  createTask,
  getTaskById,
  getTasks,
  deleteTask,
  updateTask,
  getAssignedTasks,
} from "../controllers/task.controllers.js";

import {
  createTaskValidator,
  updateTaskValidator,
} from "../validators/index.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import roleProjectPermission from "../middlewares/rolepermission.middleware.js";
import validateRequest from "../middlewares/validator.middleware.js";

import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

// Get all tasks in a project
router.get("/:projectId", roleProjectPermission(AvailableUserRole), getTasks);

// Create a task in a project
router.post(
  "/:projectId",
  roleProjectPermission([
    UserRolesEnum.ADMIN,
    UserRolesEnum.PROJECT_ADMIN,
  ]),
  upload.array("attachments", 10),
  createTaskValidator(),
  validateRequest,
  createTask
);

// Get tasks assigned to a particular user
router.get(
  "/:projectId/users/:userId",
  roleProjectPermission(AvailableUserRole),
  getAssignedTasks,
);

// Get a particular task
router.get(
  "/:projectId/tasks/:taskId",
  roleProjectPermission(AvailableUserRole),
  getTaskById,
);

// Update a particular task
router.patch(
  "/:projectId/tasks/:taskId",
  roleProjectPermission([
    UserRolesEnum.ADMIN,
    UserRolesEnum.PROJECT_ADMIN,
  ]),
  upload.array("attachments", 10),
  updateTaskValidator(),
  validateRequest,
  updateTask
);

// Delete a particular task
router.delete(
  "/:projectId/tasks/:taskId",
  roleProjectPermission([
    UserRolesEnum.ADMIN,
    UserRolesEnum.PROJECT_ADMIN,
  ]),
  deleteTask
);

export default router;
