import { Router } from "express";
import { getAllVideos } from "../controllers/video.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/").get(getAllVideos);

export default router;
