import mongoose from "mongoose";
import { ERROR_MESSAGES, SORT_TYPES } from "../constants.js";
import { getSortOrder } from "./helper.util.js";
import { ApiError } from "./ApiError.util.js";

/**
 * @description function to create pipeline aggregation for matching query and user id and sorting based on parameters given
 * @param {String | undefined} query
 * @param {String | undefined} userId
 * @param {String | undefined} sortBy
 * @param {String | undefined} sortType
 * @returns {Array} pipeline aggregate
 */
export const getAllVideosAggregatePipeline = (
  query,
  userId,
  sortBy,
  sortType
) => {
  if (sortType && !Object.values(SORT_TYPES).includes(sortBy)) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_INPUT);
  }
  const stages = [];
  // Match stage
  const match = {};
  if (query) {
    match.$or = [
      { title: { $regex: safeQuery, $options: "i" } },
      { description: { $regex: safeQuery, $options: "i" } },
    ];
  }
  if (userId) {
    match.owner = new mongoose.Types.ObjectId(userId);
  }
  if (Object.keys(match).length) stages.push({ $match: match });

  // SORT stage
  stages.push(
    {
      $sort:
        sortBy && sortType
          ? { [sortBy]: getSortOrder(sortType) }
          : { createdAt: -1 },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
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
    }
  );
  return stages;
};
