const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// Get the information of the logged user

router.get("/getUser", isAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id).populate("favourites");
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
  const { username, imgUrl, address } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.payload._id,
      { username, imgUrl, address },
      { new: true }
    );
    res.json(updatedUser);
  } catch (error) {
    res.json(error);
  }
});

module.exports = router;
