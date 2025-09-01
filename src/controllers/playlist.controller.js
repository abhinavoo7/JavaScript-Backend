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
