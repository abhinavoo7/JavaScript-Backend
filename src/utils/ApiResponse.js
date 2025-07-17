export class ApiResponse {
  // Define a class named ApiResponse
  constructor(statusCode, data, message = "Success") {
    // Constructor takes statusCode, data, and an optional message (default "Success")
    this.statusCode = statusCode; // Set the HTTP status code
    this.data = data; // Set the response data
    this.message = message; // Set the response message
    this.success = statusCode < 400; // Set success to true if statusCode is less than 400, otherwise false
  }
}
