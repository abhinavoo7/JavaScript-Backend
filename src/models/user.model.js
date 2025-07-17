import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: false,
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

userSchema.pre("save", async function (next) {
  // Pre-save hook to hash password before saving
  if (this.isModified("password")) {
    // Only hash if password is modified
    this.password = await bcrypt.hash(this.password, 10); // Hash the password with salt rounds = 10
  }
  next(); // Continue to the next middleware
});

userSchema.methods.isPasswordCorrect = async function (password) {
  // Instance method to compare passwords
  return await bcrypt.compare(password, this.password); // Compare provided password with hashed password
};

userSchema.methods.generateAccessToken = function () {
  // Instance method to generate JWT access token
  return jwt.sign(
    {
      _id: this._id, // User ID
      username: this.username, // Username
      email: this.email, // Email
      fullName: this.fullName, // Full name
    },
    process.env.ACCESS_TOKEN_SECRET, // Secret key from environment
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // Expiry time from environment
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  // Instance method to generate JWT refresh token
  return jwt.sign(
    {
      _id: this._id, // User ID
    },
    process.env.REFRESH_TOKEN_SECRET, // Secret key from environment
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // Expiry time from environment
    }
  );
};

export const User = mongoose.model("User", userSchema);
