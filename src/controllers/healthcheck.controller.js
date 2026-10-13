import ApiResponse from "../utils/ApiResponse.js";
import asynchandler from "../utils/asynchandler.js";

// asynchandler is a middleware function that wraps asynchronous route handlers to catch errors and pass them to the next middleware.

const healthcheck = asynchandler((req, res) => {
  res
    .status(200)
    .json(
      new ApiResponse(200, "Health check successful", {
        message: "Health check successful",
      }),
    );
});

export { healthcheck };
