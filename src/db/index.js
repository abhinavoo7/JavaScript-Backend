import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Define an async function to connect to the MongoDB database
const connectToDatabase = async () => {
  try {
    // Attempt to connect to MongoDB using the URL from environment variables and the DB name
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    // Log a success message with the host of the connected database
    console.log(
      `\n Connected to MongoDB successfully !! DB HOST:  ${connectionInstance.connection.host}`
    );
  } catch (error) {
    // If there is an error during connection, log the error
    console.error("Error connecting to MongoDB:", error);
    // Exit the process with a failure code
    process.exit(1);
  }
};

// Export the connectToDatabase function as the default export
export default connectToDatabase;
