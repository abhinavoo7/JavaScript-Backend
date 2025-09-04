import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .delete(verifyJwt, deletePlaylist);

router.use(verifyJwt); // Apply verifyJWT middleware to all routes below in this file

router.route("/").post(createPlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

export default router;
