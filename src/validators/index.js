import pkg from "express-validator";
import { AvailableUserRole, AvailableTaskStatus } from "../utils/constants.js";
const { body, param } = pkg;

const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),

    body("userName")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be in lowercase")
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be between 3 and 20 characters"),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),

    body("fullName").trim().notEmpty().withMessage("Full name is required"),
  ];
};

const userLoginValidator = () => {
  return [
    // Email is optional but must be valid if provided

    body("email").optional().isEmail().withMessage("Email is invalid"),

    // Username is optional but must be lowercase if provided

    body("userName")
      .optional()
      .isLowercase()
      .withMessage("Username must be lowercase"),

    // Password is required

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ];
};

const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword")
      .notEmpty()
      .withMessage("Old Password is Required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),

    body("newPassword")
      .notEmpty()
      .withMessage("New Password is Required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ];
};

const userforgotPasswordValidator = () => {
  return [
    body("email").optional().isEmail().withMessage("Provide a Valid Email"),

    body("userName")
      .optional()
      .isString()
      .withMessage("provide valid Username"),
  ];
};

const userResetPasswordValidator = () => {
  return [body("newPassword").notEmpty().withMessage("Password is Required")];
};

const CreateProjectValidator = () => {
  return [
    body("name").notEmpty().withMessage("Name is Required "),
    body("description").optional(),
  ];
};

const addMembertoProjectValidator = () => {
  return [
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Provide a valid email of the user"),

    body("username")
      .optional()
      .isString()
      .withMessage("Username must be a string")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("Username cannot be empty"),

    body().custom((_, { req }) => {
      if (!req.body.email && !req.body.username) {
        throw new Error("Provide an email or username");
      }
      return true;
    }),

    body("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(AvailableUserRole)
      .withMessage("Role is invalid"),
  ];
};

const createTaskValidator = () => {
  return [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ min: 1, max: 200 })
      .withMessage("Title must be between 1 and 200 characters"),

    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),

    body("assignedTo")
      .optional()
      .isMongoId()
      .withMessage("assignedTo must be a valid user id"),

    body("status")
      .optional()
      .isString()
      .withMessage("Status must be a string")
      .isIn(AvailableTaskStatus)
      .withMessage(`Status must be one of: ${AvailableTaskStatus.join(", ")}`),

    // attachement (note: matches your schema key 'attachement')
    body("attachments")
      .optional()
      .isArray()
      .withMessage("Attachments must be an array"),

    body("attachments.*.url")
      .optional({ nullable: true })
      .isURL()
      .withMessage("Each attachment url must be a valid URL"),

    body("attachments.*.mimetype")
      .optional({ nullable: true })
      .isString()
      .withMessage("Each attachment mimetype must be a string"),

    body("attachments.*.publicId")
      .optional({ nullable: true })
      .isString()
      .withMessage("Each attachment publicId must be a string"),

    body("attachments.*.size")
      .optional({ nullable: true })
      .isInt({ min: 0 })
      .withMessage("Each attachment size must be a non-negative integer"),
  ];
};

const updateTaskValidator = [
  // title (optional)
  body("title")
    .optional()
    .isString()
    .withMessage("title must be a string")
    .trim(),

  // description (optional)
  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string"),

  // assignedTo (optional)
  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("assignedTo must be a valid user id"),

  // status (optional)
  body("status")
    .optional()
    .isIn(AvailableTaskStatus)
    .withMessage(`status must be one of: ${AvailableTaskStatus.join(", ")}`),

  // attachments (optional)
  body("attachments")
    .optional()
    .isArray()
    .withMessage("attachments must be an array"),

  body("attachments.*.url")
    .optional()
    .isString()
    .withMessage("attachment url must be a string"),

  body("attachments.*.mimetype")
    .optional()
    .isString()
    .withMessage("attachment mimetype must be a string"),

  body("attachments.*.publicId")
    .optional()
    .isString()
    .withMessage("attachment publicId must be a string"),

  body("attachments.*.size")
    .optional()
    .isNumeric()
    .withMessage("attachment size must be a number"),
];

const subtaskTaskParamsValidator = () => [
  param("taskId").isMongoId().withMessage("Task id must be a valid id"),
];

const subtaskParamsValidator = () => [
  ...subtaskTaskParamsValidator(),
  param("subTaskId").isMongoId().withMessage("Subtask id must be a valid id"),
];

const createSubtaskValidator = () => [
  ...subtaskTaskParamsValidator(),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("status")
    .optional()
    .isString()
    .withMessage("Status must be a string")
    .isIn(AvailableTaskStatus)
    .withMessage(`Status must be one of: ${AvailableTaskStatus.join(", ")}`)
    .bail(),
];

const updateSubtaskValidator = () => [
  ...subtaskParamsValidator(),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("status")
    .optional()
    .isString()
    .withMessage("Status must be a string")
    .isIn(AvailableTaskStatus)
    .withMessage(`Status must be one of: ${AvailableTaskStatus.join(", ")}`),
  body().custom((_, { req }) => {
    if (req.body.title === undefined && req.body.status === undefined) {
      throw new Error("At least one of title or status must be provided");
    }
    return true;
  }),
];

const updateSubtaskStatusValidator = () => [
  ...subtaskParamsValidator(),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isString()
    .withMessage("Status must be a string")
    .isIn(AvailableTaskStatus)
    .withMessage(`Status must be one of: ${AvailableTaskStatus.join(", ")}`),
];

const noteProjectParamsValidator = () => [
  param("projectId").isMongoId().withMessage("Project id must be a valid id"),
];

const noteParamsValidator = () => [
  ...noteProjectParamsValidator(),
  param("noteId").isMongoId().withMessage("Note id must be a valid id"),
];

const createNoteValidator = () => [
  ...noteProjectParamsValidator(),
  body("content")
    .isString()
    .withMessage("Content must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 15000 })
    .withMessage("Content must be 15,000 characters or fewer"),
];

const updateNoteValidator = () => [
  ...noteParamsValidator(),
  body("content")
    .isString()
    .withMessage("Content must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 15000 })
    .withMessage("Content must be 15,000 characters or fewer"),
];

export {
  userLoginValidator,
  userRegisterValidator,
  userChangeCurrentPasswordValidator,
  userforgotPasswordValidator,
  userResetPasswordValidator,
  CreateProjectValidator,
  addMembertoProjectValidator,
  createTaskValidator,
  createSubtaskValidator,
  subtaskTaskParamsValidator,
  subtaskParamsValidator,
  updateSubtaskValidator,
  updateSubtaskStatusValidator,
  noteProjectParamsValidator,
  noteParamsValidator,
  createNoteValidator,
  updateNoteValidator,
  updateTaskValidator,
};
