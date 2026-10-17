import crypto from "node:crypto";
import APIError from "../utils/ApiErrors.js";
import User from "../models/user.models.js";
import { sendVerificationEmail } from "./email.controller.js";
import asynchandler from "../utils/asynchandler.js";

import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asynchandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (
    ![username, email, password].every(
      (value) => typeof value === "string" && value.trim(),
    )
  ) {
    throw new APIError(400, "Username, email, and password are required", []);
  }

  // Check if the user already exists

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  // If user exists, return an error

  if (existingUser) {
    throw new APIError(
      409,
      "User with this email or username already exists",
      [],
    );
  }

  // Create a new user

  const newUser = await User.create({
    username,
    email,
    password,
    isEmailVerified: false,
  });

  // Generate a temproray Token for email verification

  const { token, hashedToken, TokenExpiry } =
    newUser.generateEmailVerificationToken();

  newUser.emailVerificationToken = hashedToken;
  newUser.emailVerificationTokenExpiry = TokenExpiry;

  await newUser.save({ validateBeforeSave: false });

  // Send verification email
  await sendVerificationEmail({
    email: newUser.email,
    name: newUser.username,
    verificationLink: `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${token}`,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -emailVerificationToken -emailVerificationTokenExpiry -refreshToken",
  );

  if (!createdUser) {
    throw new APIError(500, "User creation failed", []);
  }

  // Return success response

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "User registered successfully and email verification initiated",
        createdUser,
      ),
    );
});

const verifyEmail = asynchandler(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    throw new APIError(400, "Email verification token is required", []);
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new APIError(400, "Email verification token is invalid or expired", []);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, "Email verified successfully", null));
});

export { registerUser, verifyEmail };
