import pkg from "express-validator";
import { AvailableUserRole } from "../utils/constants";
const { body } = pkg;

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
      .isEmail()
      .withMessage("Provide Valid Email of the User")
      .trim()
      .optional(),

    body("username").optional(),

    body("projectId").notEmpty().withMessage("Project ID is Required "),

    body("roel")
      .notEmpty()
      .withMessage("Role is Required")
      .isIn(AvailableUserRole)
      .withMessage("Role is Invalid"),
  ];
};

export {
  userLoginValidator,
  userRegisterValidator,
  userChangeCurrentPasswordValidator,
  userforgotPasswordValidator,
  userResetPasswordValidator,
  CreateProjectValidator,
  addMembertoProjectValidator,
};
