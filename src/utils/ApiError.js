export class ApiError extends Error {
  // Define and export a class ApiError that extends the built-in Error class
  constructor(
    statusCode, // HTTP status code for the error
    message = "Something went error", // Default error message if none is provided
    errors = [], // Additional error details (optional, defaults to empty array)
    stack = [] // Optional stack trace (defaults to empty array)
  ) {
    super(message); // Call the parent Error constructor with the message
    this.statusCode = statusCode; // Set the HTTP status code
    this.data = null; // Set data to null (can be used for additional info)
    this.success = false; // Indicate that the operation was not successful
    this.message = message; // Set the error message
    this.errors = errors; // Set the additional error details

    if (stack) {
      // If a stack trace is provided
      this.stack = stack; // Use the provided stack trace
    } else {
      Error.captureStackTrace(this, this.constructor); // Otherwise, capture the current stack trace
    }
  }
}
