import APIError from "../utils/ApiErrors.js";
import User from "../models/user.models.js";
import { sendVerificationEmail } from "./email.controller.js";
import asynchandler from "../utils/asynchandler.js";

import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asynchandler(async (req, res) => {
  const { username, email, password, role } = req.body;

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

  const { Token, HashedToken, TokenExpiry } =
    newUser.generateEmailVerificationToken();

  newUser.emailVerificationToken = HashedToken;
  newUser.emailVerificationTokenExpiry = TokenExpiry;

  await newUser.save({ validateBeforeSave: false });

  // Send verification email
  await sendVerificationEmail({
    email: newUser.email,
    name: newUser.username,
    verificationLink: `${req.protocol}://${req.get("host")}/api/v1/verify-email/${Token}`,
  });

  if (newUser.isEmailVerified) {
    const { accessToken, refreshToken } =
      await generateAccessTokenandRefreshToken(newUser._id);
  }

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

// Function to generate access and refresh tokens for a user and save the refresh token in the database

const generateAccessTokenandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();

    user.refreshToken = refreshtoken;
    await user.save({ validateBeforeSave: false });
    return { accesstoken, refreshtoken };
  } catch (error) {
    throw new APIError(500, "Error generating access and refresh tokens", [
      error.message,
    ]);
  }
};

export { registerUser };
