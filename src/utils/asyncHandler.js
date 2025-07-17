export const asyncHandler = (requestHandler) => {
  // Export a function named asyncHandler that takes a request handler function as an argument
  (req, res, next) => {
    // Return a middleware function with req, res, and next
    Promise.resolve(requestHandler(req, res, next)).catch(
      (
        error // Call the request handler and catch any errors
      ) => next(error) // Pass any errors to the next middleware (error handler)
    );
  };
};

/*
export const asyncHandler = (requestHandler) => async (req, res, next) => {
  // Export a function named asyncHandler that returns an async middleware
  try {
    await requestHandler(req, res, next); // Await the execution of the request handler
  } catch (error) {
    res.status(error.code || 500).json({
      // If an error occurs, send a JSON error response
      success: false, // Indicate failure
      message: error.message || "Internal Server Error", // Provide the error message or a default one
    });
  }
};
*/
