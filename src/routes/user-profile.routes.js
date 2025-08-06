import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  updateAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const userProfileRouter = Router();

userProfileRouter.use(verifyJwt);

userProfileRouter
  .route("/cover-image")
  .patch(upload.single("coverImage"), verifyJwt, updateUserCoverImage);

userProfileRouter
  .route("/avatar")
  .patch(upload.single("avatar"), verifyJwt, updateAvatar);

export default userProfileRouter;
