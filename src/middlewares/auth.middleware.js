import { asyncHandler } from "../utils/asyncHandler.util.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.util.js";
import { User } from "../models/user.model.js";
import { ERROR_MESSAGES } from "../constants.js";

export const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req?.cookies?.accessToken ||
      req?.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, ERROR_MESSAGES.COMMON.UNAUTHORIZED_REQUEST);
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, ERROR_MESSAGES.COMMON.INVALID_TOKEN);
    }

    req.user = user; // Attach user to request object
    next(); // Proceed to the next middleware
  } catch (error) {
    throw new ApiError(
      401,
      error.message ?? ERROR_MESSAGES.COMMON.UNAUTHORIZED_REQUEST
    );
  }
});
