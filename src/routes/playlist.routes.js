import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  createPlaylist,
  getPlaylistById,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/").post(verifyJwt, createPlaylist);

router.route("/:playlistId").get(getPlaylistById);

export default router;
