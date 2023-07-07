const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Linhas = require("../models/Linhas.model");
const Pinceis = require("../models/Pinceis.model");
const Panelas = require("../models/Panelas.model");
const Comment = require("../models/Comment.model");
const User = require("../models/User.model");
const fileUploader = require("../config/cloudinary.config");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

//Create a Post and put the ID in the User Database

router.post("/product", isAuthenticated, async (req, res, next) => {
  const { category, title, imgUrl, price, cardSize, color } = req.body;

  try {
    const foundTitle = await Linhas.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") },
    });
    const foundTitle2 = await Pinceis.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") },
    });
    const foundTitle3 = await Panelas.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") },
    });
    if (
      !title ||
      !imgUrl ||
      !category ||
      !price ||
      !cardSize ||
      color.length === 0
    ) {
      const missingFields = [];
      if (!title) missingFields.push("title");
      if (!imgUrl) missingFields.push("imgUrl");
      if (!category) missingFields.push("category");
      if (!price) missingFields.push("price");
      if (!cardSize) missingFields.push("cardSize");
      if (!color) missingFields.push("color");

      res.status(400).json({ message: "needs to be filled", missingFields });
      return;
    } else if (foundTitle || foundTitle2 || foundTitle3) {
      return res.status(400).json({
        message: "Esse nome já foi dado a outro Produto, escolha um novo.",
      });
    }

    let product;

    if (category === "Linhas") {
      const { description } = req.body;
      product = await Linhas.create({
        title,
        imgUrl,
        description,
        category,
        price,
        cardSize,
        color,
      });
    } else if (category === "Pincéis") {
      const { description, tema, formato, tamanho } = req.body;
      product = await Pinceis.create({
        title,
        imgUrl,
        description,
        category,
        price,
        cardSize,
        color,
        tema,
        formato,
        tamanho,
      });
    } else {
      const { description, cobertura, formato, massa } = req.body;
      product = await Panelas.create({
        title,
        imgUrl,
        description,
        category,
        price,
        cardSize,
        color,
        cobertura,
        formato,
        massa,
      });
    }

    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
    return;
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

//Get all existing products in the database

router.get("/product", async (req, res, next) => {
  try {
    const productLinhas = await Linhas.find();
    const productPinceis = await Pinceis.find();
    const productPanelas = await Panelas.find();
    console.log({ productLinhas, productPinceis, productPanelas });
    res.json({ productLinhas, productPinceis, productPanelas });
  } catch (error) {
    res.json(error);
  }
});

// Get one specific post

router.get("/product/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const productLinhas = await Linhas.findById(id)
      .populate("comments")
      .populate({
        path: "comments",
        populate: { path: "userId", model: "User" },
      });
    const productPinceis = await Pinceis.findById(id)
      .populate("comments")
      .populate({
        path: "comments",
        populate: { path: "userId", model: "User" },
      });
    const productPanelas = await Panelas.findById(id)
      .populate("comments")
      .populate({
        path: "comments",
        populate: { path: "userId", model: "User" },
      });

    if (productLinhas) {
      res.json(productLinhas);
    } else if (productPinceis) {
      res.json(productPinceis);
    } else if (productPanelas) {
      res.json(productPanelas);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.json(error);
  }
});

// Edit one specific product

router.put("/editProduct/:id", async (req, res, next) => {
  const { id } = req.params;
  const { title, description, category, price, cardSize, color } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.json("The provided id is not valid");
  }
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { title, description, category, price, cardSize, color },
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
