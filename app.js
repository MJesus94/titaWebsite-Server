// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

const helmet = require("helmet");
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'wasm-unsafe-eval'",
        "'inline-speculation-rules'",
        "https://apis.google.com",
      ],
      imgSrc: ["'self'", "https://res.cloudinary.com"],
      fontSrc: ["'self'", "https://fonts.googleapis.com"], // Add Google Fonts domain
      // Add other directives as needed
    },
  })
);

// 👇 Start handling routes here

const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const productRoutes = require("./routes/product.routes");
app.use("/api", productRoutes);

const commentRoutes = require("./routes/comment.routes");
app.use("/api", commentRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api", userRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

// ❗ Error handling middleware should be placed after defining routes

// Middleware to handle JWT errors
// const { handleJWTError } = // require("./middleware/jwt.middleware.js");
// app.use(handleJWTError);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
