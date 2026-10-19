import crypto from "node:crypto";
import APIError from "../utils/ApiErrors.js";
import User from "../models/user.models.js";
import { sendVerificationEmail } from "./email.controller.js";
import asynchandler from "../utils/asynchandler.js";

import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";

// method to call access and referesh token

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (user) {
      const accessToken = user.generateAccessToken();
      const refereshToken = user.generateRefreshToken();

      user.refreshToken = refereshToken;

      await user.save({ validateBeforeSave: false });
      return { accessToken, refereshToken };
    }
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token",
    );
  }
};

const registerUser = asynchandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

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
    fullName,
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
    emailVerificationTokenExpiry: { $gt: new Date()},
  });

  if (!user) {
    throw new APIError(
      400,
      "Email verification token is invalid or expired",
      [],
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully", null));
});

// login

const LoginUser = asynchandler(async (req, res) => {
  const { email, password, username } = req.body;

  // Require either username or email
  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(
      400,
      "User not found. Ensure username/email and password are correct",
    );
  }

  // Validate password
  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new ApiError(400, "Invalid credentials. Ensure password is correct");
  }

  const { accessToken, refereshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -emailVerificationToken -emailVerificationTokenExpiry -refreshToken",
  );

  // cookies logic here ..

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refereshToken, options)
    .json(
      new ApiResponse(
        200,
        "Login Successfully ",

        {
          user: loggedInUser,
          accessToken: accessToken,
          refereshToken: refereshToken,
        },
      ),
    );
});

export { registerUser, LoginUser ,verifyEmail};
