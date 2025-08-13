import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { User } from "../models/user.model.js";
import {
  removeFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {
  generateAccessAndRefreshTokens,
  getUserChannelPipelineAggregate,
  getWatchHistoryPipelineAggregate,
} from "../utils/UserController.util.js";
import {
  COOKIE_OPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "../constants.js";

export const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response with user details
  const { username, email, fullName, password } = req?.body ?? {};

  if (
    [fullName, email, username, password].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.ALL_FIELDS_REQUIRED);
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    throw new ApiError(409, ERROR_MESSAGES.USER.ALREADY_EXISTS);
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImgLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, ERROR_MESSAGES.USER.AVATAR_IMAGE_REQUIRED);
  }

  const avtaar = await uploadOnCloudinary(avatarLocalPath);

  let coverImagePath;

  if (
    coverImgLocalPath?.secure_url?.trim() !== "" &&
    Array.isArray(req.files?.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = await uploadOnCloudinary(coverImgLocalPath);
  }

  if (!avtaar) {
    throw new ApiError(500, ERROR_MESSAGES.USER.AVATAR_UPLOAD_FAILED);
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avtaar?.secure_url,
    coverImage: coverImagePath?.secure_url ?? "", // Optional cover image
    password, // Ensure to hash the password before saving in production
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, ERROR_MESSAGES.USER.USER_RESIGTRATION_FAILED);
  }

  // Assume user registration logic here
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUser,
        SUCCESS_MESSAGES.USER.REGISTERED_SUCCESSFULLY
      )
    );
});

export const loginUser = asyncHandler(async (req, res) => {
  // get user details from req body
  // validation - not empty
  // check if user exists: username, email
  // check for password match
  // create access token and refresh token
  // return response with user details and token as cookies

  const { username, email, password } = req?.body ?? {};

  if (!username && !email) {
    throw new ApiError(400, ERROR_MESSAGES.USER.MISSING_USERNAME_EMAIL);
  }

  if (!password || password.trim() === "") {
    throw new ApiError(400, ERROR_MESSAGES.USER.PASSWORD_REQUIRED);
  }

  const userData = await User.findOne({ $or: [{ username }, { email }] });

  if (!userData) {
    throw new ApiError(404, ERROR_MESSAGES.USER.DOES_NOT_EXIST);
  }

  const isPasswordValid = await userData.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, ERROR_MESSAGES.USER.INVALID_PASSWORD);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    userData._id
  );

  const loggedInUser = await User.findById(userData._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, COOKIE_OPTIONS)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        SUCCESS_MESSAGES.USER.LOGGED_IN
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req?.user?._id; // Get user from request object set by verifyJwt middleware
  if (!userId) {
    throw new ApiError(400, ERROR_MESSAGES.USER.DOES_NOT_EXIST);
  }

  await User.findByIdAndUpdate(
    userId,
    {
      $unset: { refreshToken: 1 }, // Clear the refresh token
    },
    {
      new: true, // Return the updated document
      runValidators: false, // Validate the update operation
    }
  );
  return res
    .status(200)
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json(new ApiResponse(200, {}, SUCCESS_MESSAGES.USER.LOGGED_OUT));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, ERROR_MESSAGES.COMMON.UNAUTHORIZED_REQUEST);
  }

  try {
    const decodedIncomingRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const userId = decodedIncomingRefreshToken?._id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new ApiError(401, ERROR_MESSAGES.COMMON.INVALID_TOKEN);
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, ERROR_MESSAGES.USER.REFRESH_TOKEN_INVALID);
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, COOKIE_OPTIONS)
      .cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          SUCCESS_MESSAGES.USER.TOKEN_REFRESH
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message ?? ERROR_MESSAGES.USER.REFRESH_TOKEN_INVALID
    );
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, ERROR_MESSAGES.USER.PASSWORD_REQUIRED);
  }
  if (oldPassword?.trim() === newPassword?.trim()) {
    throw new ApiError(400, ERROR_MESSAGES.USER.SAME_PASSWORD);
  }
  const userId = req?.user?._id;
  const user = await User.findById(userId);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, ERROR_MESSAGES.USER.INVALID_PASSWORD);
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, SUCCESS_MESSAGES.USER.PASSWORD_UPDATE));
});

export const getCurrentUser = asyncHandler((req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, SUCCESS_MESSAGES.USER.USER_FETCHED));
});

export const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.ALL_FIELDS_REQUIRED);
  }
  const updatedUser = await User.findByIdAndUpdate(
    req?.user?.id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, SUCCESS_MESSAGES.USER.USER_UPDATED)
    );
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req?.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, ERROR_MESSAGES.USER.AVATAR_IMAGE_REQUIRED);
  }
  const prevAvatarImageUrl = req?.user?.avatar;
  await removeFromCloudinary(prevAvatarImageUrl);
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.secure_url) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.FILE_UPLOAD_ERROR);
  }
  const updatedUser = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        avatar: avatar.secure_url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, SUCCESS_MESSAGES.USER.AVTAR_UPDATED)
    );
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req?.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, ERROR_MESSAGES.USER.COVER_IMAGE_MISSING);
  }
  const prevCoverImageUrl = req?.user?.coverImage;
  if (prevCoverImageUrl) {
    await removeFromCloudinary(prevCoverImageUrl);
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.secure_url) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.FILE_UPLOAD_ERROR);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        coverImage: coverImage.secure_url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        SUCCESS_MESSAGES.USER.COVER_IMAGE_UPDATED
      )
    );
});

export const deleteUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageUrl = req.user?.coverImage;
  if (!coverImageUrl) {
    throw new ApiError(404, ERROR_MESSAGES.USER.NO_COVER_IMAGE);
  }
  await removeFromCloudinary(coverImageUrl);
  const updatedUser = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        coverImage: "",
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        SUCCESS_MESSAGES.USER.REMOVED_COVER_IMAGE
      )
    );
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req?.params;
  if (!username?.trim()) {
    throw new ApiError(400, ERROR_MESSAGES.USER.USERNAME_MISSING);
  }

  const channel = await User.aggregate(
    getUserChannelPipelineAggregate(username, String(req?.user?._id))
  );

  if (!channel?.length) {
    throw new ApiError(404, ERROR_MESSAGES.USER.CHANNEL_NOT_EXIST);
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel?.[0], SUCCESS_MESSAGES.USER.CHANNEL_FETCHED)
    );
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate(
    getWatchHistoryPipelineAggregate(String(req?.user?._id))
  );

  if (!user) {
    throw new ApiError(404, ERROR_MESSAGES.USER.DOES_NOT_EXIST);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        SUCCESS_MESSAGES.USER.WATCH_HISTORY_FETCHED
      )
    );
});
