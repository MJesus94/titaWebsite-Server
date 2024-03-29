const { Schema, model } = require("mongoose");

const pinceisSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    imgUrl: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    price: { type: Number, required: true },
    color: { type: [String], required: true },
    tema: { type: String, required: true },
    formato: { type: String, required: true },
    tamanho: { type: String, required: true },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Pinceis = model("Pinceis", pinceisSchema);

module.exports = Pinceis;
