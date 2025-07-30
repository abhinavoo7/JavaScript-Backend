import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (useId) => {
  try {
    const userData = User.findById(useId);
    const accessToken = userData.generateAccessToken();
    const refreshToken = userData.generateRefreshToken();
    userData.refreshToken = refreshToken; // Save refresh token in user document
    await userData.save({ validateBeforeSave: false }); // Save the user document with the new refresh token
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

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

export const loginUser = asyncHandler(async (req, res) => {
  // get user details from req body
  // validation - not empty
  // check if user exists: username, email
  // check for password match
  // create access token and refresh token
  // return response with user details and token as cookies

  const { username, email, password } = req?.body ?? {};

  if ([username, email].some((field) => !field || field?.trim() === "")) {
    throw new ApiError(400, "Username or email is required");
  }

  if (!password || password.trim() === "") {
    throw new ApiError(400, "Password is required");
  }

  const userData = await User.findOne({ $or: [{ username }, { email }] });

  if (!userData) {
    throw new ApiError(404, "User does not exists");
  }

  const isPasswordValid = await userData.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    userData._id
  );

  const loggedInUser = await User.findById(userData._id).select(
    "-password -refreshToken"
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true, // Use secure cookies in production
    sameSite: "Strict", // Prevent CSRF attacks
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req?.user?._id; // Get user from request object set by verifyJwt middleware
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  const cookieOptions = {
    httpOnly: true,
    secure: true, // Use secure cookies in production
    sameSite: "Strict", // Prevent CSRF attacks
  };
  const userData = await User.findByIdAndUpdate(
    userId,
    {
      $set: { refreshToken: null }, // Clear the refresh token
    },
    {
      new: true, // Return the updated document
      runValidators: false, // Validate the update operation
    }
  );
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});
