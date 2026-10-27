import { Router } from "express";

import {
  createSubTask,
  getSubTasks,
  updateSubTask,
  deleteSubTask,
  updateSubTaskStatus,
} from "../controllers/subtask.controllers.js";

import {
  createSubtaskValidator,
  subtaskTaskParamsValidator,
  subtaskParamsValidator,
  updateSubtaskValidator,
  updateSubtaskStatusValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import roleProjectPermission from "../middlewares/rolepermission.middleware.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";
import validateRequest from "../middlewares/validator.middleware.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/:projectId/tasks/:taskId/subtasks")
  .get(
    roleProjectPermission(AvailableUserRole),
    subtaskTaskParamsValidator(),
    validateRequest,
    getSubTasks,
  )
  .post(
    roleProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    createSubtaskValidator(),
    validateRequest,
    createSubTask,
  );

router
  .route("/:projectId/tasks/:taskId/subtasks/:subTaskId")
  .put(
    roleProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    updateSubtaskValidator(),
    validateRequest,
    updateSubTask,
  )
  .patch(
    roleProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    updateSubtaskValidator(),
    validateRequest,
    updateSubTask,
  )
  .delete(
    roleProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    subtaskParamsValidator(),
    validateRequest,
    deleteSubTask,
  );

router
  .route("/:projectId/tasks/:taskId/subtasks/:subTaskId/status")
  .patch(
    roleProjectPermission(AvailableUserRole),
    updateSubtaskStatusValidator(),
    validateRequest,
    updateSubTaskStatus,
  );

export default router;
