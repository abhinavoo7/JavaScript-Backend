import { asyncHandler } from "../utils/asyncHandler.util.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.util.js";
import { User } from "../models/user.model.js";

export const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req?.cookies?.accessToken ||
      req?.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized access");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "invalid token");
    }

    req.user = user; // Attach user to request object
    next(); // Proceed to the next middleware
  } catch (error) {
    throw new ApiError(401, error.message ?? "Unauthorized access");
  }
});
