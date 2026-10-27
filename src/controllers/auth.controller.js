import crypto from "node:crypto";
import APIError from "../utils/ApiErrors.js";
import User from "../models/user.models.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./email.controller.js";
import asynchandler from "../utils/asynchandler.js";

import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import jwt from "jsonwebtoken";

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

// method to call access and referesh token

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (user) {
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;

      await user.save({ validateBeforeSave: false });
      return { accessToken, refreshToken };
    }
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token",
    );
  }
};

const registerUser = asynchandler(async (req, res) => {
  const { userName, email, password, fullName } = req.body;

  if (
    ![userName, email, password].every(
      (value) => typeof value === "string" && value.trim(),
    )
  ) {
    throw new APIError(400, "Username, email, and password are required", []);
  }

  // Check if the user already exists

  const existingUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  // If user exists, return an error

  if (existingUser) {
    throw new APIError(
      409,
      "User with this email or userName already exists",
      [],
    );
  }

  // Create a new user

  const newUser = await User.create({
    userName,
    email,
    fullName,
    password,
    isEmailVerified: false,
  });

  // Generate a temproray Token for email verification

  const { token, hashedToken, tokenExpiry } =
    newUser.generateEmailVerificationToken();

  newUser.emailVerificationToken = hashedToken;
  newUser.emailVerificationtokenExpiry = tokenExpiry;

  await newUser.save({ validateBeforeSave: false });

  // Send verification email; roll back the account if delivery fails so the
  // user can retry registration with the same email and userName.
  try {
    await sendVerificationEmail({
      email: newUser.email,
      userName: newUser.userName,
      verificationLink: `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${token}`,
    });
  } catch (emailError) {
    try {
      await User.deleteOne({ _id: newUser._id });
    } catch (cleanupError) {
      console.error(
        "Failed to remove the newly created user after verification email failure:",
        cleanupError,
      );
      throw new APIError(
        500,
        "Registration failed and account cleanup could not be completed",
        [],
      );
    }

    console.error("Verification email failed; registration was rolled back:", emailError);
    throw new APIError(
      502,
      "Verification email could not be sent. Registration was not completed; please try again.",
      [],
    );
  }

  const createdUser = await User.findById(newUser._id).select(
    "-password -emailVerificationToken -emailVerificationtokenExpiry  -refreshToken",
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
    emailVerificationtokenExpiry: { $gt: new Date() },
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
  user.emailVerificationtokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully", null));
});

// login

const loginUser = asynchandler(async (req, res) => {
  const { email, password, userName } = req.body;

  // Require either userName or email
  if (!userName && !email) {
    throw new ApiError(400, "Username or Email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(
      400,
      "User not found. Ensure userName/email and password are correct",
    );
  }

  // Validate password
  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new ApiError(400, "Invalid credentials. Ensure password is correct");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -emailVerificationToken -emailVerificationtokenExpiry  -refreshToken",
  );

  // cookies logic here ..

  return res
    .status(200)
    .cookie("accessToken", accessToken, authCookieOptions)
    .cookie("refreshToken", refreshToken, authCookieOptions)
    .json(
      new ApiResponse(
        200,
        "Login Successfully ",

        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken,
        },
      ),
    );
});

//logout
// signle device logout deletes all sessions on all devices 
const logoutUser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $inc: { tokenVersion: 1 },
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .clearCookie("accessToken", authCookieOptions)
    .clearCookie("refreshToken", authCookieOptions)
    .json(new ApiResponse(200, "User Logged Out", {}));
});

// getCurrentUser

const getCurrentUser = asynchandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched Successfully", req.user));
});

//resend Email Token
const resendEmailVerification = asynchandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (user.isEmailVerified) {
    throw new ApiError(409, "Email has already verified ");
  }

  const { token, hashedToken, tokenExpiry } =
    user.generateEmailVerificationToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationtokenExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  // Send verification email again
  await sendVerificationEmail({
    email: user.email,
    userName: user.userName,
    verificationLink: `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${token}`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "email verification initiated", {}));
});

//Refresh Access Token based On referesh Token

const refreshAccessToken = asynchandler(async (req, res) => {
  const incomingRT = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRT) {
    throw new ApiError(401, "Unauthorized Access");
  }

  // decoding RT
  let decodedToken;
  try {
    decodedToken = jwt.verify(incomingRT, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    if (err.name == "TokenExpiredError") {
      throw new ApiError(401, "Refresh token expired. Please log in again.");
    }
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.refreshToken !== incomingRT) {
    throw new ApiError(403, "Invalid refresh token");
  }

  //generate new RT

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  user.refreshToken = newRefreshToken;

  await user.save();

  res
    .status(200)
    .cookie("accessToken", accessToken, authCookieOptions)
    .cookie("refreshToken", newRefreshToken, authCookieOptions)
    .json(
      new ApiResponse(200, "Access token refreshed", {
        accessToken,
        refreshToken: newRefreshToken,
      }),
    );
});

//Forget Password

const forgotPassword = asynchandler(async (req, res) => {
  const { userName, email } = req.body;
  if (!userName && !email) {
    throw new ApiError(400, "Provide userName or email");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  // Always return the same generic response to avoid user enumeration
  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "If an account exists, a reset link has been sent to the registered email",
        ),
      );
  }

  const { token, hashedToken, tokenExpiry } =
    user.generateForgotPasswordToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordtokenExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  try {
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");
    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not configured");
    }

    const resetLink = `${frontendUrl}/reset-password?resetToken=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({
      email: user.email,
      userName: user.userName,
      resetLink,
    });
  } catch (error) {
    // Cleanup on email failure
    user.forgotPasswordToken = undefined;
    user.forgotPasswordtokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send reset email");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "If an account exists, a reset link has been sent to the registered email"),
    );
});

const resetForgotPassword = asynchandler(async (req, res) => {
  const { resetToken } = req.query;
  const { newPassword } = req.body;

  if (!resetToken || !newPassword) {
    throw new ApiError(400, "Missing reset token or new password");
  }

  // Hash incoming token the same way it was stored
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedResetToken,
    forgotPasswordtokenExpiry: { $gt: Date.now() }, // ensure not expired
  });

  if (!user) {
    throw new ApiError(403, "Token is invalid or expired");
  }

  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;

  // Clear reset token fields (single-use)
  user.forgotPasswordToken = undefined;
  user.forgotPasswordtokenExpiry = undefined;
  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .clearCookie("accessToken", authCookieOptions)
    .clearCookie("refreshToken", authCookieOptions)
    .json(new ApiResponse(200, "Password reset successfully"));
});

const changeOldPassword = asynchandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);


    if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  // compare oldPassword

  const isValid = await user.comparePassword(oldPassword);

  if (!isValid) {
    throw new ApiError(400, "Invalid Old Password ");
  }

  user.password = newPassword;

  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  user.refreshToken = undefined;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .clearCookie("accessToken", authCookieOptions)
    .clearCookie("refreshToken", authCookieOptions)
    .json(new ApiResponse(200, "Password Changed Successfully", {}));
});

export {
  registerUser,
  loginUser,
  verifyEmail,
  logoutUser,
  getCurrentUser,
  resendEmailVerification,
  refreshAccessToken,
  forgotPassword,
  resetForgotPassword,
  changeOldPassword
};
