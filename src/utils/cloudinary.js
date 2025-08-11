import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error("No file path provided for upload.");
    }
    // Upload an image
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically determine the resource type
    });
    try {
      fs.unlinkSync(localFilePath);
    } catch (error) {
      console.error("Failed to delete", localFilePath);
    }
    return response; // Return the upload result
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Delete the file if upload fails
    }
    console.error("Error uploading file to Cloudinary:", error);
    return null;
  }
};

export const removeFromCloudinary = async (url) => {
  try {
    if (!url) {
      throw new ApiError(400, "Incorrect cloudinary url");
    }
    const publicId = url.split("/").pop().split(".")[0];
    const result = cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new ApiError(400, "Failed to delete from cloudinary");
  }
};
