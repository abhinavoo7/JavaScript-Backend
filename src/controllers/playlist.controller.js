import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { checkValidMongooseId, trimParams } from "../utils/helper.util.js";

export const createPlaylist = asyncHandler(async (req, res) => {
  const [name, description] = trimParams(req.body.name, req.body.description);
  if (!name || !description) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.ALL_FIELDS_REQUIRED);
  }
  if (!req.user._id) {
    throw new ApiError(401, ERROR_MESSAGES.COMMON.UNAUTHORIZED_REQUEST);
  }
  try {
    const playList = await Playlist.create({
      name,
      description,
      owner: req.user._id,
    });
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          playList,
          SUCCESS_MESSAGES.PLAYLIST.CREATION_SUCCESS
        )
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, ERROR_MESSAGES.PLAYLIST.CREATION_FAILED);
  }
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params?.playlistId?.trim();
  if (!playlistId) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  if (!checkValidMongooseId(playlistId)) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  try {
    const playList = await Playlist.findById(playlistId)
      .populate("owner", "fullName username")
      .select("-__v -updatedAt");
    if (!playList) {
      throw new ApiError(404, ERROR_MESSAGES.PLAYLIST.NOT_FOUND);
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          playList,
          SUCCESS_MESSAGES.PLAYLIST.FETCH_SUCCESSFUL
        )
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, ERROR_MESSAGES.COMMON.DATA_FETCH_FAILED);
  }
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const [playlistId, videoId] = trimParams(
    req.params?.playlistId,
    req.params?.videoId
  );
  if (
    !playlistId ||
    !videoId ||
    !checkValidMongooseId(playlistId) ||
    !checkValidMongooseId(videoId)
  ) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  try {
    const playList = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        owner: req.user._id,
      },
      { $addToSet: { videos: videoId } },
      { new: true }
    )
      .select("-__v")
      .populate("owner", "fullName username email");

    if (!playList.owner.equals(req.user._id)) {
      throw new ApiError(403, ERROR_MESSAGES.COMMON.UNAUTHORIZED_REQUEST);
    } else if (!playList) {
      throw new ApiError(404, ERROR_MESSAGES.PLAYLIST.NOT_FOUND);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          playList,
          SUCCESS_MESSAGES.PLAYLIST.VIDEO_ADDITION_SUCCESSFULL
        )
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, ERROR_MESSAGES.PLAYLIST.VIDEO_ADDITION_FAILED);
  }
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const [playlistId, videoId] = trimParams(
    req.params?.playlistId,
    req.params?.videoId
  );
  if (
    !playlistId ||
    !videoId ||
    !checkValidMongooseId(playlistId) ||
    !checkValidMongooseId(videoId)
  ) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  try {
    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) throw new ApiError(404, ERROR_MESSAGES.VIDEO.NOT_FOUND);

    const playList = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        owner: req.user._id,
      },
      {
        $pull: { videos: videoId },
      },
      { new: true }
    )
      .select("-__v")
      .populate("owner", "fullName username email");
    if (!playList.owner.equals(req.user._id)) {
      throw new ApiError(403, ERROR_MESSAGES.COMMON.UNAUTHORIZED_REQUEST);
    } else if (!playList) {
      throw new ApiError(404, ERROR_MESSAGES.PLAYLIST.NOT_FOUND);
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, playList, SUCCESS_MESSAGES.PLAYLIST.VIDEO_REMOVED)
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, ERROR_MESSAGES.PLAYLIST.VIDEO_REMOVAL_FAILED);
  }
});
