import { ERROR_MESSAGES } from "../constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.util.js";

export const generateAccessAndRefreshTokens = async (useId) => {
  try {
    const userData = await User.findById(useId);
    const accessToken = userData.generateAccessToken();
    const refreshToken = userData.generateRefreshToken();
    userData.refreshToken = refreshToken; // Save refresh token in user document
    await userData.save({ validateBeforeSave: false }); // Save the user document with the new refresh token
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, ERROR_MESSAGES.USER.TOKEN_GENERATION_FAILED);
  }
};
