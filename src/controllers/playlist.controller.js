import mongoose from "mongoose";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";

export const createPlaylist = asyncHandler(async (req, res) => {
  let { name, description } = req.body;
  name = name?.trim();
  description = description?.trim();
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
  let { playlistId } = req.params;
  playlistId = playlistId?.trim();
  if (!playlistId) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, ERROR_MESSAGES.COMMON.INCORRECT_PARAM);
  }
  try {
    const playlist = await Playlist.findById(playlistId).populate(
      "owner",
      "fullName username"
    );
    if (!playlist) {
      throw new ApiError(404, ERROR_MESSAGES.PLAYLIST.NOT_FOUND);
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          playlist,
          SUCCESS_MESSAGES.PLAYLIST.FETCH_SUCCESSFUL
        )
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, ERROR_MESSAGES.COMMON.DATA_FETCH_FAILED);
  }
});
