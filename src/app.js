import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Create an Express application instance
export const app = express();

// Enable CORS with specific origin and credentials support
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // Allow requests from this origin (from environment variable)
    credentials: true, // Allow cookies and credentials to be sent with requests
  })
);

// Parse incoming JSON requests with a size limit of 16kb
app.use(
  express.json({
    limit: "16kb", // Limit the size of JSON payloads to 16 kilobytes
  })
);

// Parse URL-encoded data with a size limit of 16kb
app.use(urlencoded({ extended: true, limit: "16kb" })); // Support URL-encoded bodies (e.g., form submissions)

// Serve static files from the "public" directory
app.use(express.static("public")); // Make files in the "public" folder accessible via HTTP

// Parse cookies attached to the client
app.use(cookieParser()); // Parse cookies from incoming requests and populate req.cookies

// routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter); // Mount the user routes under the "/users" path
app.use("/api/v1/videos", videoRouter);
