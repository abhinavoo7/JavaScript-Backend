import { asyncHandler } from "../utils/asyncHandler.js";

export const registerUser = asyncHandler(async (req, res) => {
  // Assume user registration logic here
  res.status(200).json({
    message: "OK",
  });
});
