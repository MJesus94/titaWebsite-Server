const { expressjwt: jwt, UnauthorizedError } = require("express-jwt");

// Instantiate the JWT token validation middleware
const isAuthenticated = jwt({
  secret: process.env.TOKEN_SECRET,
  algorithms: ["HS256"],
  requestProperty: "payload",
  getToken: getTokenFromHeaders,
});

// Custom error handling middleware to handle JWT errors
function handleJWTError(err, req, res, next) {
  if (err instanceof UnauthorizedError && err.code === "invalid_token") {
    // Token expired
    return res
      .status(401)
      .json({ message: "Your session has expired, please login again" });
  }

  // Pass the error to the next error handler
  next(err);
}

// Function used to extract the JWT token from the request's 'Authorization' Headers
function getTokenFromHeaders(req) {
  // Check if the token is available on the request Headers
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    // Get the encoded token string and return it
    const token = req.headers.authorization.split(" ")[1];
    return token;
  }

  return null;
}

// Export the middleware and error handler
module.exports = {
  isAuthenticated,
  handleJWTError,
};
