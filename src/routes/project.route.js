import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import validateRequest from "../middlewares/validator.middleware.js";
import {
  addMemberToProject,
  createProject,
  deleteProjectById,
  listProjectMembers,
  updateProjectDetails,
  updateProjectMemberRoles,
  deleteProjectMember,
  getProjects,
  getProjectbyId,
} from "../controllers/project.controllers.js";

import roleProjectPermission from "../middlewares/rolepermission.middleware.js";

import {
  CreateProjectValidator,
  addMembertoProjectValidator,
} from "../validators/index.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router();

//now by default all routes after this have req.user
router.use(verifyJWT);

router
  .route("/")
  .get(getProjects)
  .post(CreateProjectValidator(), validateRequest, createProject);

router
  .route("/:projectId")
  .get(roleProjectPermission(AvailableUserRole), getProjectbyId)
  .put(
    roleProjectPermission([UserRolesEnum.ADMIN]),
    CreateProjectValidator(),
    validateRequest,
    updateProjectDetails,
  )
  .delete(roleProjectPermission([UserRolesEnum.ADMIN]), deleteProjectById);

router
  .route("/:projectId/members")

  .get(roleProjectPermission(AvailableUserRole), listProjectMembers)

  .post(
    roleProjectPermission([UserRolesEnum.ADMIN]),
    addMembertoProjectValidator(),
    validateRequest,
    addMemberToProject,
  );

router
  .route("/:projectId/members/:userId")
  .put(
    roleProjectPermission([UserRolesEnum.ADMIN]),
    updateProjectMemberRoles,
  )
  .delete(
    roleProjectPermission([UserRolesEnum.ADMIN]),
    deleteProjectMember,
  );

export default router;
