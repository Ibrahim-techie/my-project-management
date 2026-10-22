import asynchandler from "../utils/asynchandler.js";
import ApiError from "../utils/ApiErrors.js";
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
      "-password -emailVerificationToken -emailVerificationtokenExpiry  -refreshToken"
    );
    if (!user) return next(new ApiError(401, "Invalid Access Token"));
    if (decodedToken.tokenVersion !== user.tokenVersion) {
      return next(new ApiError(401, "Access token has been revoked"));
    }
    req.user = user; // ADD the User details decoded in AT
    next();
  } catch (error) {
    return next(new ApiError(401, "Invalid Access Token"));
  }
});

