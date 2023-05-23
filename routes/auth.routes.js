const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");

const crypto = require("crypto");

const dns = require("dns");

const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ℹ️ Handles password encryption
const jwt = require("jsonwebtoken");

// Require the User model in order to interact with the database
const User = require("../models/User.model");

// Require necessary (isAuthenticated) middleware in order to control access to specific routes
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

function generateConfirmationCode() {
  const length = 8; // Length of the confirmation code
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";
  let bytes;

  // Generate random bytes using a secure cryptographic algorithm
  try {
    bytes = crypto.randomBytes(length);
  } catch (error) {
    // Handle random bytes generation error
    throw new Error("Failed to generate random bytes for confirmation code.");
  }

  // Convert the random bytes to a string representation
  for (let i = 0; i < length; i++) {
    const index = bytes[i] % charset.length;
    code += charset[index];
  }

  return code;
}

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
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, name, admin } = req.body;

    // Validate email, password, and name
    if (!email || !password || !name) {
      res.status(400).json({ message: "Provide email, password, and name" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Provide a valid email address." });
      return;
    }

    if (!passwordRegex.test(password)) {
      res.status(400).json({
        message:
          "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
      });
      return;
    }

    const foundUser = await User.findOne({ email });
    const foundUserN = await User.findOne({ name });

    if (foundUser || foundUserN) {
      res.status(400).json({ message: "User or username already exists." });
      return;
    }

    const domainExists = await checkEmailDomain(email);

    if (!domainExists) {
      res.status(400).json({ message: "Email domain does not exist." });
      return;
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const createdUser = await User.create({
      email,
      password: hashedPassword,
      name,
      admin,
      confirmationCode: "", // Initialize confirmation code with an empty string
      isEmailConfirmed: false, // Set the email confirmation status to false
    });

    const confirmationCode = generateConfirmationCode();
    createdUser.confirmationCode = confirmationCode;
    await createdUser.save();

    const msg = {
      to: email,
      from: "miguel.angelo.jesus@hotmail.com", // Replace with your email address
      subject: "Email Confirmation",
      html: `Please confirm your email by clicking the following link: <a href="${process.env.BASE_URL}/confirm-email/${confirmationCode}">Confirm Email</a>`,
    };
    await sgMail.send(msg);

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
  } catch (err) {
    next(err);
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
