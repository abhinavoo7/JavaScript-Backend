import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response with user details
  const { username, email, fullName, password } = req?.body ?? {};

  if (
    [fullName, email, username, password].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const avtarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImgLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avtarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avtaar = await uploadOnCloudinary(avtarLocalPath);

  let coverImagePath;

  if (
    coverImgLocalPath?.secure_url?.trim() !== "" &&
    Array.isArray(req.files?.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = await uploadOnCloudinary(coverImgLocalPath);
  }

  if (!avtaar) {
    throw new ApiError(500, "Failed to upload avtaar");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avtaar?.secure_url,
    coverImage: coverImagePath?.secure_url ?? "", // Optional cover image
    password, // Ensure to hash the password before saving in production
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Assume user registration logic here
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});
