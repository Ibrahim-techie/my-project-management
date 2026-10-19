import asynchandler from "../utils/asynchandler";
import ApiError from "../utils/ApiErrors";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";


//accessToken middleware 
export const verifyJWT = asynchandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "").trim();

  if (!token) return next(new ApiError(401, "Unauthorized request"));

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id).select(
      "-password -emailVerificationToken -emailVerificationTokenExpiry -refreshToken"
    );
    if (!user) return next(new ApiError(401, "Invalid Access Token"));
    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(401, "Invalid Access Token"));
  }
});

