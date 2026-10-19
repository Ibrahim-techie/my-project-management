import pkg from "express-validator";
const { validationResult } = pkg;


import ApiError  from "../utils/ApiErrors.js";

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors
    .array()
    .map((err) => ({ [err.path]: err.msg }));

  return next(new ApiError(422, "Validation Error", extractedErrors));
};

export default validateRequest;
