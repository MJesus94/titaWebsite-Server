const { Schema, model } = require("mongoose");

const productSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    imgUrl: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    price: { type: Number, required: true },
    cardSize: { type: String, required: true },
    color: { type: [String], required: true },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Product = model("Product", productSchema);

module.exports = Product;
