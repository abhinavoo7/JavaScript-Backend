import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";
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

export const publishVideo = asyncHandler(async (req, res) => {
  let { title, description } = req.body;
  title = title?.trim();
  description = description?.trim();
  if (!title || !description) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.ALL_FIELDS_REQUIRED);
  }
  const userId = req?.user?._id;
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if (videoFileLocalPath === thumbnailLocalPath) {
    throw new ApiError(400, ERROR_MESSAGES.VIDEO.SAME_THUMBNAIL_VIDEO);
  }
  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.ALL_FIELDS_REQUIRED);
  }
  const uploadedVideo = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  const video = await Video.create({
    title,
    description,
    owner: userId,
    videoFile: uploadedVideo.secure_url,
    thumbnail: thumbnail.secure_url,
    duration: uploadedVideo.duration,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, SUCCESS_MESSAGES.VIDEOS.UPLOAD_SUCCESS));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  const video = await Video.findById(videoId?.trim()).populate(
    "owner",
    "fullName username"
  );
  if (!video) {
    throw new ApiError(404, ERROR_MESSAGES.VIDEO.VIDEO_NOT_FOUND);
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, video, SUCCESS_MESSAGES.COMMON.FETCH_SUCCESSFUL)
    );
});
