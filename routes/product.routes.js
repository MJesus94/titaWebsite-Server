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
  const { category, title, imgUrl, price, color } = req.body;

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
    if (!title || !imgUrl || !category || !price || color.length === 0) {
      const missingFields = [];
      if (!title) missingFields.push("title");
      if (!imgUrl) missingFields.push("imgUrl");
      if (!category) missingFields.push("category");
      if (!price) missingFields.push("price");
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
  const { title, description, price, color } = req.body;
  if (!title || !price || color.length === 0) {
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!price) missingFields.push("price");
    if (!color) missingFields.push("color");

    res.status(400).json({ message: "needs to be filled", missingFields });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.json("The provided id is not valid");
  }
  try {
    const linhasProduct = await Linhas.findById(id);
    const panelasProduct = await Panelas.findById(id);

    if (linhasProduct) {
      const updatedLinhasProduct = await Linhas.findByIdAndUpdate(
        id,
        { title, description, price, color },
        { new: true }
      ).populate("comments");

      res.json(updatedLinhasProduct);
    } else if (panelasProduct) {
      const { massa, formato, cobertura } = req.body;
      if (!massa || !formato || !cobertura) {
        const missingFields = [];
        if (!massa) missingFields.push("massa");
        if (!formato) missingFields.push("formato");
        if (!cobertura) missingFields.push("cobertura");

        res.status(400).json({ message: "needs to be filled", missingFields });
        return;
      }
      const updatedPanelasProduct = await Panelas.findByIdAndUpdate(
        id,
        { title, description, price, color, massa, formato, cobertura },
        { new: true }
      ).populate("comments");
      res.json(updatedPanelasProduct);
    } else {
      const { tema, formato, tamanho } = req.body;
      if (!tema || !formato || !tamanho) {
        const missingFields = [];
        if (!tema) missingFields.push("tema");
        if (!formato) missingFields.push("formato");
        if (!tamanho) missingFields.push("tamanho");

        res.status(400).json({ message: "needs to be filled", missingFields });
        return;
      }
      const updatedPinceisProduct = await Pinceis.findByIdAndUpdate(
        id,
        { title, description, price, color, tema, formato, tamanho },
        { new: true }
      ).populate("comments");
      res.json(updatedPinceisProduct);
    }
  } catch (error) {
    res.json(error);
  }
});

// Delete a specific product

router.delete("/product/:id", isAuthenticated, async (req, res, next) => {
  const { id } = req.params;

  try {
    let deletedProduct;
    let commentField;

    deletedProduct = await Linhas.findByIdAndDelete(id);
    commentField = "linhasId";
    if (deletedProduct) {
      res.json({
        message: `Product with ID ${id} was successfully deleted from Linhas`,
      });
      return;
    }

    deletedProduct = await Pinceis.findByIdAndDelete(id);
    if (deletedProduct) {
      commentField = "pinceisId";
      res.json({
        message: `Product with ID ${id} was successfully deleted from Pinceis`,
      });
      return;
    }

    deletedProduct = await Panelas.findByIdAndDelete(id);
    if (deletedProduct) {
      commentField = "panelasId";
      res.json({
        message: `Product with ID ${id} was successfully deleted from Panelas`,
      });
      return;
    }
    await Comment.deleteMany({ [commentField]: id });
    await User.findByIdAndUpdate(req.payload._id, {
      $pull: { favourites: id },
    });
    res.status(404).json({ error: `Product with ID ${id} not found` });
  } catch (error) {
    res.status(500).json(error);
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

router.get("/add")

module.exports = router;
