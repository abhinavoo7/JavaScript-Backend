import { Router } from "express";
import {
  changePassword,
  deleteUserCoverImage,
  updateAvatar,
  updateUserCoverImage,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const userProfileRouter = Router();

userProfileRouter
  .route("/cover-image")
  .patch(upload.single("coverImage"), updateUserCoverImage)
  .delete(deleteUserCoverImage);

userProfileRouter.route("/avatar").patch(upload.single("avatar"), updateAvatar);

userProfileRouter.route("/change-password").patch(changePassword);

userProfileRouter.route("/update-user").patch(updateUserDetails);

export default userProfileRouter;
