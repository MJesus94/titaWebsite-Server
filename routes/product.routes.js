const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product.model");
const Comment = require("../models/Comment.model");
const User = require("../models/User.model");
const fileUploader = require("../config/cloudinary.config");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

//Create a Post and put the ID in the User Database

router.post("/product", isAuthenticated, async (req, res, next) => {
  const { title, imgUrl, description, category, price, cardSize } = req.body;
  try {
    if (!title || !imgUrl || !category || !price || !cardSize) {
      res.status(400).json({ message: "Fill all the mandatory fields" });
      return;
    } else {
      const product = await Product.create({
        title,
        imgUrl,
        description,
        category,
        price,
        cardSize,
      });
      console.log(product);
      res.json(product);
    }
  } catch (error) {
    res.json(error);
  }
});

// Upload file to cloudinary and get the URL of that file

router.post("/upload", fileUploader.single("imageUrl"), (req, res, next) => {
  // console.log("file is: ", req.file)

  if (!req.file) {
    next(new Error("No file uploaded!"));
    return;
  }

  // Get the URL of the uploaded file and send it as a response.
  // 'fileUrl' can be any name, just make sure you remember to use the same when accessing it on the frontend

  res.json({ fileUrl: req.file.path });
});

//Get all existing posts in the database

router.get("/product", async (req, res, next) => {
  try {
    const Products = await Product.find();
    res.json(Products);
  } catch (error) {
    res.json(error);
  }
});

// Get one specific post

router.get("/product/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id)
      .populate("comments")
      .populate({
        path: "comments",
        populate: { path: "userId", model: "User" },
      });
    res.json(product);
  } catch (error) {
    res.json(error);
  }
});

// Edit one specific product

router.put("/editProduct/:id", async (req, res, next) => {
  const { id } = req.params;
  const { title, description, category, price, cardSize } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.json("The provided id is not valid");
  }
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { title, description, category, price, cardSize },
      { new: true }
    ).populate("comments");

    res.json(updatedProduct);
  } catch (error) {
    res.json(error);
  }
});

// Delete a specific product

router.delete("/product/:id", isAuthenticated, async (req, res, next) => {
  const { id } = req.params;

  try {
    const post = await Product.findById(id);
    await Comment.deleteMany({ productId: id });
    await User.findByIdAndUpdate(req.payload._id, {
      $pull: { favourites: id },
    });
    await Product.findByIdAndDelete(id);
    res.json({ message: `Product with the id ${id} was successfully deleted` });
  } catch (error) {
    res.json(error);
  }
});

// Add a post as favourite in the favourite section of the user

router.put("/favourites/:id", isAuthenticated, async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.json("The provided id is not valid");
  }
  try {
    await User.findByIdAndUpdate(req.payload._id, {
      $push: { favourites: id },
    });
    const user = await User.findById(req.payload._id);
    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

// Pull ID from the user favourites array

router.delete(
  "/deleteFavourites/:id",
  isAuthenticated,
  async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.json("The provided id is not valid");
    }
    try {
      const user = await User.findByIdAndUpdate(
        req.payload._id,
        {
          $pull: { favourites: id },
        },
        { new: true }
      );
      res.json(user);
    } catch (error) {
      res.json(error);
    }
  }
);

router.get("/checkFavourite/:id", isAuthenticated, async (req, res, next) => {
  const { id } = req.params;
  let verify = false;
  const currentUser = req.payload._id;

  console.log(verify);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.json("The provided id is not valid");
  }

  try {
    const response = await User.findById(currentUser);

    console.log(response.data);
    for (let i = 0; i < response.data.favourites.length; i++) {
      if (id === response.data.favourites[i]._id) {
        verify = true;
      } else if (!response.data.favourites.length) {
        verify = false;
      } else {
        continue;
      }
    }
    res.json(verify);
  } catch (error) {
    res.json(error);
  }
});

module.exports = router;
