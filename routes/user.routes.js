const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// Get the information of the logged user

router.get("/getUser", isAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id)
      .populate("favourites.Pinceis")
      .populate("favourites.Linhas")
      .populate("favourites.Panelas");

    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

router.get("/getUser/:id", isAuthenticated, async (req, res, next) => {
  const { id } = req.params;
  try {
    const specificUser = await User.findById(id)
      .populate("favourites")
      .populate({
        path: "favourites",
        populate: { path: "comments", model: "Comment" },
      });

    res.json(specificUser);
  } catch (error) {
    res.json(error);
  }
});

// Edit user profile information

router.put("/editUser", isAuthenticated, async (req, res, next) => {
  const { name, phoneNumber, street, zipCode, city } = req.body;
  const address = { street: street, zipCode: zipCode, city: city };
  console.log(req.body);
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.payload._id,
      { name, phoneNumber, address },
      { new: true }
    );
    res.json(updatedUser);
    console.log(updatedUser);
  } catch (error) {
    res.json(error);
  }
});

module.exports = router;
