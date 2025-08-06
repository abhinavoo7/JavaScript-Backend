import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import userProfileRouter from "./user-profile.routes.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secure routes

router.route("/logout").post(verifyJwt, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

// integrating user profile router
router.use("/update-user-profile", userProfileRouter);

export default router;
