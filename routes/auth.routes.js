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
const {
  isAuthenticated,
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/jwt.middleware.js");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

function generateConfirmationCode() {
  const length = 6; // Length of the confirmation code
  const charset = "0123456789";

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
      console.log("Provide email, password, and name");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Provide a valid email address." });
      console.log("Provide a valid email address.");
      return;
    }

    if (!passwordRegex.test(password)) {
      res.status(400).json({
        message:
          "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
      });
      console.log(
        "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter."
      );
      return;
    }

    const foundUser = await User.findOne({ email });

    if (foundUser) {
      res.status(400).json({ message: "Email already exists" });
      console.log("Email already exists");
      return;
    }

    const domainExists = await checkEmailDomain(email);

    if (!domainExists) {
      res.status(400).json({ message: "Email domain does not exist." });
      console.log("Email domain does not exist.");
      return;
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const createdUser = await User.create({
      email: email,
      password: hashedPassword,
      name: name,
      admin,
      confirmationCode: "",
      isEmailConfirmed: false,
      recoveryPasswordCode: "",
      isCodeConfirmed: false,
      orders: [],
      address: { street: "Default", zipCode: "2725-999", city: "Lisboa" },
      phoneNumber: "",
      refreshToken: "",
      favourites: [],
    });

    const confirmationCode = generateConfirmationCode();
    createdUser.confirmationCode = confirmationCode;
    await createdUser.save();

    const msg = {
      to: email,
      from: "miguel.angelo.jesus@hotmail.com",
      subject: "Email Confirmation",
      html: `<p>Hello,</p>

      <p>Please confirm your email by clicking the following link: </p>
      
      <a href="${process.env.BASE_URL}/confirm-email/${confirmationCode}">Confirm Email</a>
      
      <p>If you already confirmed your email, you can ignore this message.</p>
      
      <p>Best regards,</p>
      <p>Fonzie</p>`,
    };
    await sgMail.send(msg);

    const {
      email: createdEmail,
      name: createdName,
      _id,
      admin: createdAdmin,
    } = createdUser;

    const userData = {
      email: createdEmail,
      name: createdName,
      _id,
      admin: createdAdmin,
    };

    res
      .status(201)
      .json({ message: "Account created with success", user: userData });
  } catch (err) {
    next(err);
  }
});

// POST  /auth/login - Verifies email and password and returns a JWT
/* router.post("/login", (req, res, next) => {
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
      if (foundUser.isEmailConfirmed === false) {
        res.status(401).json({ message: "Please confirm your email first" });
      }
      // Compare the provided password with the one saved in the database
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        // Deconstruct the user object to omit the password
        const { _id, email, name } = foundUser;

        // Create an object that will be set as the token payload
        const payload = { _id, email, name };

        // Create a JSON Web Token and sign it
        const authToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        User.findByIdAndUpdate(
          foundUser._id,
          { $set: { refreshToken, authToken } },
          { new: true },
          (err, updatedUser) => {
            if (err) {
              // Handle error if update fails
              return res.status(500).json({ message: "Internal Server Error" });
            }

            // Send the tokens as the response
            res.status(200).json({ authToken, refreshToken });
          }
        );

                const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        }); 

        // Send the token as the response
               res.status(200).json({ authToken: authToken }); 
      } else {
        res.status(401).json({
          message:
            "Credentials wrong, check if your email and password are correct",
        });
      }
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
}); */

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Check if email or password are provided as empty string
    if (email === "" || password === "") {
      return res.status(400).json({ message: "Provide email and password." });
    }

    // Check the users collection if a user with the same email exists
    const foundUser = await User.findOne({ email });

    if (!foundUser) {
      return res.status(401).json({ message: "User not found." });
    }

    if (!foundUser.isEmailConfirmed) {
      return res
        .status(401)
        .json({ message: "Please confirm your email first" });
    }

    // Compare the provided password with the one saved in the database
    const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

    if (passwordCorrect) {
      // Deconstruct the user object to omit the password
      const { _id, email, name } = foundUser;

      // Create an object that will be set as the token payload
      const payload = { _id, email, name };

      // Create a JSON Web Token and sign it
      const authToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      const updatedUser = await User.findByIdAndUpdate(
        foundUser._id,
        { $set: { refreshToken, authToken } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(500).json({ message: "Internal Server Error" });
      }

      // Send the tokens as the response
      return res.status(200).json({ authToken, refreshToken });
    } else {
      return res.status(401).json({
        message:
          "Credentials wrong, check if your email and password are correct",
      });
    }
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
});

router.post("/auth/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  try {
    // Verify the refresh token
    const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find the user in the database
    const existingUser = await User.findById(user.userId);

    if (!existingUser || existingUser.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token
    const authToken = jwt.sign(
      { userId: user.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    // Update the user's access token
    existingUser.authToken = authToken;
    await existingUser.save();

    res.json({ authToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET  /auth/verify  -  Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res, next) => {
  // If JWT token is valid the payload gets decoded by the
  // isAuthenticated middleware and is made available on `req.payload`
  // console.log(`req.payload`, req.payload);

  // Send back the token payload object containing the user data
  res.status(200).json(req.payload);
});

router.get("/confirm-email/:confirmationCode", async (req, res, next) => {
  try {
    const { confirmationCode } = req.params;
    console.log(confirmationCode);

    // Find the user with the matching confirmation code
    const user = await User.findOne({ confirmationCode });

    if (!user) {
      // Invalid confirmation code
      res.status(400).json({ message: "Invalid confirmation code." });
      return;
    }

    // Mark the user's email as confirmed
    user.isEmailConfirmed = true;
    user.confirmationCode = null;
    await user.save();

    // Redirect the user to a confirmation success page or send a success response
    res.status(200).json({ message: "Email confirmed successfully." });
  } catch (err) {
    next(err);
  }
});

router.post("/sendPasswordResetCode", async (req, res, next) => {
  try {
    const { email } = req.body;

    const domainExists = await checkEmailDomain(email);

    if (!domainExists) {
      res.status(400).json({ message: "Email domain does not exist." });
      return;
    }

    // Find the user with the matching confirmation code
    const user = await User.findOne({ email });

    console.log(user);
    if (!user) {
      // Invalid confirmation code
      res.status(400).json({ message: "Invalid email." });
      return;
    }

    const recoveryPasswordCode = generateConfirmationCode();
    user.recoveryPasswordCode = recoveryPasswordCode;
    user.isCodeConfirmed = null;
    await user.save();

    const msg = {
      to: email,
      from: "miguel.angelo.jesus@hotmail.com",
      subject: "Password Reset Code",
      html: `<p>Hello,</p>

      <p>We received a request to reset your password. Your password reset code is:</p>
      
      <h2>${recoveryPasswordCode}</h2>
      
      <p>If you didn't request a password reset, you can ignore this message.</p>
      
      <p>Best regards,</p>
      <p>Fonzie</p>`,
    };
    await sgMail.send(msg);

    // Redirect the user to a confirmation success page or send a success response
    res.status(200).json({ sent: true });
  } catch (err) {
    next(err);
  }
});

router.post("/passwordResetCode", async (req, res, next) => {
  try {
    const { recoveryPasswordCode } = req.body;
    console.log(recoveryPasswordCode);

    // Find the user with the matching confirmation code
    const user = await User.findOne({ recoveryPasswordCode });

    if (!user) {
      // Invalid confirmation code
      res.status(400).json({ message: "Invalid confirmation code." });
      return;
    }

    // Mark the user's email as confirmed
    user.isCodeConfirmed = true;
    user.recoveryPasswordCode = null;
    await user.save();

    // Redirect the user to a confirmation success page or send a success response
    res.status(200).json({ message: "confirmed", user });
  } catch (err) {
    next(err);
  }
});

router.put("/newPassword", async (req, res, next) => {
  try {
    const { password, confirmPassword, email } = req.body;

    // Find the user with the matching confirmation code

    const filter = { email: email };
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const newPassword = { password: hashedPassword };

    if (password === confirmPassword) {
      await User.findOneAndUpdate(filter, newPassword);
    } else {
      res.status(400).json({ message: "Passwords must be the same" });
      return;
    }

    // Redirect the user to a confirmation success page or send a success response
    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
