export const DB_NAME = "vidtube";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // Use secure cookies in production
  sameSite: "Strict", // Prevent CSRF attacks
};

export const SORT_TYPES = {
  ASCENDING: "asc",
  DECENDING: "desc",
};

export const SUCCESS_MESSAGES = {
  USER: {
    REGISTERED_SUCCESSFULLY: "User registered successfully!",
    LOGGED_IN: "User logged in successfully!",
    LOGGED_OUT: "User logged out successfully!",
    TOKEN_REFRESH: "Tokens refreshed successfully!",
    PASSWORD_UPDATE: "Password updated successfully!",
    USER_FETCHED: "User fetched successfully!",
    USER_UPDATED: "User details updated successfully!",
    AVTAR_UPDATED: "Avatar updated successfully!",
    COVER_IMAGE_UPDATED: "Cover Image updated successfully!",
    REMOVED_COVER_IMAGE: "Cover Image removed successfully!",
    CHANNEL_FETCHED: "User channel fetched successfully",
    WATCH_HISTORY_FETCHED: "Watched history fetched successfully!",
  },
  VIDEOS: {
    VIDEOS_FETCHED: "Videos Fetched successfully!",
  },
};

export const ERROR_MESSAGES = {
  COMMON: {
    ALL_FIELDS_REQUIRED: "All fields are required!",
    UNAUTHORIZED_REQUEST: "Unauthorized request!",
    INVALID_TOKEN: "Invalid token!",
    FILE_UPLOAD_ERROR: "Error while uploading file.",
    INCORRECT_INPUT: "Invalid input provided!",
  },
  USER: {
    ALREADY_EXISTS: "User already exists!",
    AVATAR_IMAGE_REQUIRED: "Avatar image is required!",
    AVATAR_UPLOAD_FAILED: "Failed to upload avtar.",
    USER_RESIGTRATION_FAILED:
      "Something went wrong while registering the user.",
    MISSING_USERNAME_EMAIL: "Username or email is required!",
    PASSWORD_REQUIRED: "Password is required!",
    DOES_NOT_EXIST: "User does not exists!",
    INVALID_PASSWORD: "Invalid password!",
    REFRESH_TOKEN_INVALID: "Invalid refresh token!",
    SAME_PASSWORD: "New password cannot be same as old password.",
    COVER_IMAGE_MISSING: "Cover Image file missing!",
    NO_COVER_IMAGE: "No cover image exists!",
    USERNAME_MISSING: "Username missing!",
    CHANNEL_NOT_EXIST: "Channel does not exist!",
    TOKEN_GENERATION_FAILED: "Failed to generate tokens",
  },
  UPLOAD: {
    NO_PATH_PROVIDED: "No file path provided!",
    INVALID_CLOUDINARY_URL: "Incorrect cloudinary url!",
    CLOUDINARY_DELETE_FAILED: "Failed to delete from cloudinary.",
  },
};
