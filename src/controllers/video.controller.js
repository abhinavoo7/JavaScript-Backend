import { SUCCESS_MESSAGES } from "../constants.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { getAllVideosAggregatePipeline } from "../utils/VideoController.util.js";

export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const options = {
    page: +page,
    limit: +limit,
  };
  const aggregate = Video.aggregate(
    getAllVideosAggregatePipeline(
      query?.trim(),
      userId?.trim(),
      sortBy?.trim(),
      sortType?.trim()
    )
  );
  const videos = await Video.aggregatePaginate(aggregate, options);
  return res
    .status(200)
    .json(new ApiResponse(200, videos, SUCCESS_MESSAGES.VIDEOS.VIDEOS_FETCHED));
});
