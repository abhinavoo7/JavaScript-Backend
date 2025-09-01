import mongoose from "mongoose";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import {
  removeFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.util.js";
import { getAllVideosAggregatePipeline } from "../utils/VideoController.util.js";

export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  if (isNaN(page) || page <= 0 || isNaN(limit) || limit <= 0) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_INPUT);
  }
  const options = {
    page: +page,
    limit: +limit,
  };
  let videos;
  try {
    const aggregate = Video.aggregate(
      getAllVideosAggregatePipeline(
        query?.trim(),
        userId?.trim(),
        sortBy?.trim(),
        sortType?.trim()
      )
    );
    videos = await Video.aggregatePaginate(aggregate, options);
  } catch (error) {
    console.error(err);
    throw new ApiError(500, ERROR_MESSAGES.VIDEO.DATA_FETCH_FAILED);
  }
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
  let uploadedVideo, uploadedThumbnail, video;
  try {
    uploadedVideo = await uploadOnCloudinary(videoFileLocalPath);
    uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!uploadedVideo?.secure_url || !uploadedThumbnail?.secure_url) {
      throw new ApiError(500, ERROR_MESSAGES.VIDEO.UPLOAD_FAILED);
    }
    video = await Video.create({
      title,
      description,
      owner: userId,
      videoFile: uploadedVideo.secure_url,
      thumbnail: uploadedThumbnail.secure_url,
      duration: uploadedVideo.duration,
    });
  } catch (err) {
    console.error(err);
    throw new ApiError(500, ERROR_MESSAGES.VIDEO.UPLOAD_FAILED);
  }
  return res
    .status(201)
    .json(new ApiResponse(201, video, SUCCESS_MESSAGES.VIDEOS.UPLOAD_SUCCESS));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.VIDEO_NOT_FOUND);
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

export const updateVideo = asyncHandler(async (req, res) => {
  let { videoId } = req.params;
  videoId = videoId?.trim();
  if (!videoId) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, ERROR_MESSAGES.COMMON.UNAUTHORIZED_REQUEST);
  }
  const updates = {};
  let updatedVideo;
  if (req.body?.title) updates.title = req.body.title.trim();
  if (req.body?.description) updates.description = req.body.description.trim();
  if (req.files?.thumbnail) updates.thumbnail = req.files.thumbnail[0].path;
  if (req.files?.videoFile) updates.videoFile = req.files.videoFile[0].path;
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.MISSING_INPUT_FIELDS);
  }
  try {
    if (updates?.thumbnail) {
      await removeFromCloudinary(video?.thumbnail);
      const uploadedThumb = await uploadOnCloudinary(updates.thumbnail);
      updates.thumbnail = uploadedThumb.secure_url;
    }
    if (updates?.videoFile) {
      await removeFromCloudinary(video?.videoFile);
      const uploadedVideoFile = await uploadOnCloudinary(updates?.videoFile);
      updates.videoFile = uploadedVideoFile.secure_url;
    }
    updatedVideo = await Video.findOneAndUpdate(
      {
        _id: videoId,
        owner: req?.user._id,
      },
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, ERROR_MESSAGES.VIDEO.VIDEO_UPDATE_FAIL);
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        SUCCESS_MESSAGES.VIDEOS.VIDEO_UPDATED_SUCCESSFULLY
      )
    );
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  let video;
  try {
    video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, ERROR_MESSAGES.VIDEO.VIDEO_NOT_FOUND);
    }
    if (video.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, ERROR_MESSAGES.COMMON.NOT_AUTHORIZED);
    }
    await Video.findByIdAndDelete(videoId);
    await removeFromCloudinary(video.thumbnail);
    await removeFromCloudinary(video.videoFile);
  } catch (error) {
    console.error(err);
    throw new ApiError(400, ERROR_MESSAGES.VIDEO.VIDEO_DELETE_FAILED);
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, video, SUCCESS_MESSAGES.VIDEOS.VIDEO_DELETE_SUCCESS)
    );
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, ERROR_MESSAGES.VIDEO.VIDEO_NOT_FOUND);
    }
    if (video.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, ERROR_MESSAGES.COMMON.NOT_AUTHORIZED);
    }
    const updatedVideo = await Video.findOneAndUpdate(
      {
        _id: videoId,
        owner: req?.user._id,
      },
      [
        { $set: { isPublished: { $not: "$isPublished" } } }, // toggle boolean
      ]
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedVideo,
          SUCCESS_MESSAGES.VIDEOS.PUBLISH_STATUS_TOGGLESED
        )
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, ERROR_MESSAGES.VIDEO.TOGGLE_PUBLISH_FAILED);
  }
});
