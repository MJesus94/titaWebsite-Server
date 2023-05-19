const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");

const dns = require("dns");

// ℹ️ Handles password encryption
const jwt = require("jsonwebtoken");

// Require the User model in order to interact with the database
const User = require("../models/User.model");

// Require necessary (isAuthenticated) middleware in order to control access to specific routes
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

//function to check if the email domain exists!

function checkEmailDomain(email) {
  return new Promise((resolve, reject) => {
    const domain = email.substring(email.lastIndexOf("@") + 1);
    dns.resolveMx(domain, (err, addresses) => {
      if (err || addresses.length === 0) {
        resolve(false); // Domain does not exist or has no MX records
      } else {
        resolve(true); // Domain exists
      }
    });
  });
}

// POST /auth/signup  - Creates a new user in the database
/* router.post("/signup", (req, res, next) => {
  const { email, password, name } = req.body;

  // Check if email or password or name are provided as empty strings
  if (email === "" || password === "" || name === "") {
    res.status(400).json({ message: "Provide email, password, and name" });
    return;
  }

  // This regular expression checks that the email is of a valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // This regular expression checks the password for special characters and minimum length
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message:
        "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
    });
    return;
  }

  // Check the users collection if a user with the same email already exists
  User.findOne({ email })
    .then((foundUser) => {
      // If the user with the same email already exists, send an error response
      if (foundUser) {
        res.status(400).json({ message: "User already exists." });
        return;
      }

      // Add the code to check the email domain
      checkEmailDomain(email, (domainExists) => {
        if (domainExists) {
          // If the email domain exists, proceed to hash the password
          const salt = bcrypt.genSaltSync(saltRounds);
          const hashedPassword = bcrypt.hashSync(password, salt);

          // Create the new user in the database
          return User.create({ email, password: hashedPassword, name })
            .then((createdUser) => {
              // Deconstruct the newly created user object to omit the password
              // We should never expose passwords publicly
              const { email, name, _id } = createdUser;

              // Create a new object that doesn't expose the password
              const user = { email, name, _id };

              // Send a JSON response containing the user object
              res.status(201).json({ user: user });
            })
            .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
        } else {
          // If the email domain does not exist, send an error response
          res.status(400).json({ message: "Email domain does not exist." });
        }
      });
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
}); */

// POST /auth/signup  - Creates a new user in the database
router.post("/signup", async (req, res, next) => {
  // Check the users collection if a user with the same email already exists
  try {
    const { email, password, name, admin } = req.body;
    console.log(name);

    // Check if email or password or name are provided as empty strings
    if (email === "" || password === "" || name === "") {
      res.status(400).json({ message: "Provide email, password, and name" });
      return;
    }

    // This regular expression checks that the email is of a valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Provide a valid email address." });
      return;
    }

    // This regular expression checks the password for special characters and minimum length
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({
        message:
          "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
      });
      return;
    }

    const foundUser = await User.findOne({ email });
    const foundUserN = await User.findOne({ name });
    if (foundUser) {
      res.status(400).json({ message: "User already exists." });
      return;
    }

    if (foundUserN) {
      res.status(400).json({ message: "Username already exists." });
      return;
    }

    // Add the code to check the email domain
    const domainExists = await checkEmailDomain(email);

    if (domainExists) {
      // If the email domain exists, proceed to hash the password and create the user
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);
      if (admin) {
        const createdUser = await User.create({
          email,
          password: hashedPassword,
          name,
          admin,
        });

        // Deconstruct the newly created user object to omit the password
        const {
          email: createdEmail,
          name: createdName,
          _id,
          admin: createdAdmin,
        } = createdUser;

        const user = {
          email: createdEmail,
          name: createdName,
          _id,
          admin: createdAdmin,
        };

        res.status(201).json({ user });
      } else {
        const createdUser = await User.create({
          email,
          password: hashedPassword,
          name,
        });

        // Deconstruct the newly created user object to omit the password
        const { email: createdEmail, name: createdName, _id } = createdUser;

        const user = { email: createdEmail, name: createdName, _id };

        res.status(201).json({ user });
      }
    } else {
      // If the email domain does not exist, send an error response
      res.status(400).json({ message: "Email domain does not exist." });
    }
  } catch (err) {
    next(err); // Send error handling to the error handling middleware
  }
});

// POST  /auth/login - Verifies email and password and returns a JWT
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  // Check if email or password are provided as empty string
  if (email === "" || password === "") {
    res.status(400).json({ message: "Provide email and password." });
    return;
  }

  // Check the users collection if a user with the same email exists
  User.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        // If the user is not found, send an error response
        res.status(401).json({ message: "User not found." });
        return;
      }

      // Compare the provided password with the one saved in the database
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        // Deconstruct the user object to omit the password
        const { _id, email, name } = foundUser;

        // Create an object that will be set as the token payload
        const payload = { _id, email, name };

        // Create a JSON Web Token and sign it
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });

        // Send the token as the response
        res.status(200).json({ authToken: authToken });
      } else {
        res.status(401).json({ message: "Unable to authenticate the user" });
      }
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});

// GET  /auth/verify  -  Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res, next) => {
  // If JWT token is valid the payload gets decoded by the
  // isAuthenticated middleware and is made available on `req.payload`
  // console.log(`req.payload`, req.payload);

  // Send back the token payload object containing the user data
  res.status(200).json(req.payload);
});

module.exports = router;
