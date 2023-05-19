const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const mongoose = require("mongoose");
const Product = require("../models/Product.model");
const Comment = require("../models/Comment.model");

// Create a comment on a Post

router.post("/createComment/:id", isAuthenticated, async (req, res, next) => {
  
  const { id } = req.params;

  const { comment } = req.body;
  console.log(comment);

  const idUser = req.payload._id;

  try {
    const newComment = await Comment.create({comment});
    await Product.findByIdAndUpdate(id, {$push: { comments: newComment._id }}, {new: true})
    await Comment.findByIdAndUpdate(newComment._id, {$push: { userId: idUser}}, {new: true})
    await Comment.findByIdAndUpdate(newComment._id, {$push: { productId: id }}, {new: true})
    res.json(newComment)
  } catch (error) {
    res.json(error);
  }
});

// Delete a comment that the user created

router.delete("/deleteComment/:productId/:commentId", async (req, res, next) => {
  const { productId } = req.params;
  const { commentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.json("The provided id is not valid");
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    res.json("The provided id is not valid");
  }
  try {
    await Product.findByIdAndUpdate(productId, {
      $pull: { comments: commentId },
    });
    await Comment.findByIdAndRemove(commentId)
    const product = await Product.findById(productId);
    res.json(product);
  } catch (error) {
    res.json(error);
  }
});

// edit a comment

router.put("/editComment/:id", async (req, res, next) => {
  const { id } = req.params;
  const {comment} = req.body;
  try {
    await Product.findByIdAndUpdate(id, {comment: comment});
    const product = await Product.findById(id);
    res.json(product);
  } catch (error) {
    res.json(error);
  }
});
module.exports = router;

















