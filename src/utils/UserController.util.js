import mongoose from "mongoose";
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

/**
 * @description build an array for user channel pipeline aggregate
 * @param {String} username
 * @param {String} userId
 * @returns {Array} pipeline aggregate
 */
export const getUserChannelPipelineAggregate = (username, userId) => {
  return [
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
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(userId),
                "$subscribers.subscriber",
              ],
            },
            then: true,
            else: false,
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
  ];
};

/**
 * @description build an array for watch history pipeline aggregate
 * @param {String} userId
 * @returns {Array} pipeline aggregate
 */
export const getWatchHistoryPipelineAggregate = (userId) => {
  return [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
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
                    project: 1,
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
  ];
};
