import { Router } from "express";
import {
  getCurrentUser,
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

router.route("/refresh-token").post(refreshAccessToken);

router.use(verifyJwt);

router.route("/logout").post(logoutUser);

router.route("/user").get(getCurrentUser);

// integrating user profile router
router.use("/update-user-profile", userProfileRouter);

export default router;
