// require("dotenv").config({ path: "./env" }); old way to load env variables
// (Commented out) The old CommonJS way to load environment variables from a file

import dotenv from "dotenv";
import connectToDatabase from "./db/index.js";
import { app } from "./app.js";

// Load environment variables from the .env file
dotenv.config({ path: "./env" }); // Configure dotenv to use the "./env" file

connectToDatabase() // Call the function to connect to the MongoDB database
  .then(() => {
    // After loading env variables successfully
    app.on("error", (error) => {
      // Listen for errors on the Express app
      console.error("Error in Express server:", error); // Log the error
      throw error; // Throw the error to stop the process
    });
    app.listen(process.env.PORT || 8000, () => {
      // Start the server on the specified port or 8000
      console.log(`Server is running on port: ${process.env.PORT}`); // Log the port number
    });
  })
  .catch((error) => {
    // If dotenv fails to load env variables
    console.error("Mongo db connection failed", error); // Log the error
  });

/*
The following block is commented out and shows an alternative way to connect to MongoDB and start the server using an async IIFE (Immediately Invoked Function Expression):

import express from "express";
const app = express(); // Create a new Express application instance
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`); // Connect to MongoDB using environment variables for URL and DB name
    app.on("error", (error) => {
      console.error("Error in Express server:", error); // Log the error if one occurs
      throw error; // Throw the error to stop the process
    });
    app.listen(process.env.PORT, () => {
      // Start the server on the port specified in environment variables
      console.log(`Server is running on port ${process.env.PORT}`); // Log a message indicating the server is running
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error); // Log any error that occurs during MongoDB connection
    throw error; // Throw the error to stop the process
  }
})();
*/
