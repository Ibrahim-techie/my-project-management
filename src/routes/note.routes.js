import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getNotes,
  updateNote,
  deleteNote,
  createNote,
  getNoteById,
} from "../controllers/notes.controllers.js";
import roleProjectPermission from "../middlewares/rolepermission.middleware.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";
import {
  createNoteValidator,
  noteParamsValidator,
  noteProjectParamsValidator,
  updateNoteValidator,
} from "../validators/index.js";
import validateRequest from "../middlewares/validator.middleware.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/:projectId")
  .get(
    roleProjectPermission(AvailableUserRole),
    noteProjectParamsValidator(),
    validateRequest,
    getNotes,
  )
  .post(
    roleProjectPermission([UserRolesEnum.ADMIN]),
    createNoteValidator(),
    validateRequest,
    createNote,
  );

router
  .route("/:projectId/n/:noteId")
  .get(
    roleProjectPermission(AvailableUserRole),
    noteParamsValidator(),
    validateRequest,
    getNoteById,
  )
  .put(
    roleProjectPermission([UserRolesEnum.ADMIN]),
    updateNoteValidator(),
    validateRequest,
    updateNote,
  )
  .delete(
    roleProjectPermission([UserRolesEnum.ADMIN]),
    noteParamsValidator(),
    validateRequest,
    deleteNote,
  );

export default router;
