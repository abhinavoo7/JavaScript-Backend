import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  getPlaylistById,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/:playlistId").get(getPlaylistById);

router.use(verifyJwt); // Apply verifyJWT middleware to all routes below in this file

router.route("/").post(createPlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);

export default router;
