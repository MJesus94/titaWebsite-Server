/* const { expressjwt: jwt, UnauthorizedError } = require("express-jwt");

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


// Export the middleware and error handler
module.exports = { isAuthenticated }; */

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("express-jwt");

const TOKEN_SECRET = process.env.TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

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

function generateAccessToken(payload) {
  return jwt.sign(payload, TOKEN_SECRET, { expiresIn: "6h" });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}

function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

function isAuthenticated(req, res, next) {
  try {
    const token = getTokenFromHeaders(req);
    if (!token) {
      throw new UnauthorizedError("No token provided");
    }
    const payload = verifyToken(token, TOKEN_SECRET);
    req.payload = payload;
    next();
  } catch (error) {
    next(error);
  }
}

function refreshToken(req, res) {
  try {
    const refreshToken = getTokenFromHeaders(req);
    if (!refreshToken) {
      throw new UnauthorizedError("No token provided");
    }
    const payload = verifyToken(refreshToken, REFRESH_TOKEN_SECRET);

    // Generate a new access token
    const newAccessToken = generateAccessToken(payload);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
}

module.exports = {
  isAuthenticated,
  refreshToken,
  generateAccessToken,
  generateRefreshToken,
};
