import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {
  removeFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (useId) => {
  try {
    const userData = await User.findById(useId);
    const accessToken = userData.generateAccessToken();
    const refreshToken = userData.generateRefreshToken();
    userData.refreshToken = refreshToken; // Save refresh token in user document
    await userData.save({ validateBeforeSave: false }); // Save the user document with the new refresh token
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

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
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImgLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
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
    throw new ApiError(500, "Failed to upload avtaar");
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
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Assume user registration logic here
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
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
    throw new ApiError(400, "Username or email is required");
  }

  if (!password || password.trim() === "") {
    throw new ApiError(400, "Password is required");
  }

  const userData = await User.findOne({ $or: [{ username }, { email }] });

  if (!userData) {
    throw new ApiError(404, "User does not exists");
  }

  const isPasswordValid = await userData.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    userData._id
  );

  const loggedInUser = await User.findById(userData._id).select(
    "-password -refreshToken"
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true, // Use secure cookies in production
    sameSite: "Strict", // Prevent CSRF attacks
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req?.user?._id; // Get user from request object set by verifyJwt middleware
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  const cookieOptions = {
    httpOnly: true,
    secure: true, // Use secure cookies in production
    sameSite: "Strict", // Prevent CSRF attacks
  };
  await User.findByIdAndUpdate(
    userId,
    {
      $set: { refreshToken: null }, // Clear the refresh token
    },
    {
      new: true, // Return the updated document
      runValidators: false, // Validate the update operation
    }
  );
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedIncomingRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const userId = decodedIncomingRefreshToken?._id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new ApiError(401, "Invalid token");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token invalid");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "Strict", // Prevent CSRF attacks
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          "Tokens refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message ?? "Invalid refresh token");
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Password requied!");
  }
  if (oldPassword?.trim() === newPassword?.trim()) {
    throw new ApiError(400, "New password cannot be same as old password");
  }
  const userId = req?.user?._id;
  const user = await User.findById(userId);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Incorrect Password!");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully!"));
});

export const getCurrentUser = asyncHandler((req, res) => {
  console.log(req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

export const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields required");
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
      new ApiResponse(200, updatedUser, "User details updated successfully")
    );
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req?.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file missing");
  }
  const prevAvatarImageUrl = req?.user?.avatar;
  await removeFromCloudinary(prevAvatarImageUrl);
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.secure_url) {
    throw new ApiError(400, "Error while uploading file");
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
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully!"));
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req?.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file missing");
  }
  const prevCoverImageUrl = req?.user?.coverImage;
  if (prevCoverImageUrl) {
    await removeFromCloudinary(prevCoverImageUrl);
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.secure_url) {
    throw new ApiError(400, "Error while uploading file");
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
      new ApiResponse(200, updatedUser, "Cover Image updated successfully!")
    );
});

export const deleteUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageUrl = req.user?.coverImage;
  if (!coverImageUrl) {
    throw new ApiResponse(404, "No cover image exists!");
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
      new ApiResponse(200, updatedUser, "Cover Image removed successfully!")
    );
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req?.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username missing!");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req?.user?._id, "$subscribers.subscriber"],
              then: true,
              else: false,
            },
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  console.log(channel);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does notexist!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel?.[0], "User channel fetched successfully")
    );
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(req?.user?._id)),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "onwer",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    $project: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watched history fetched successfully"
      )
    );
});
