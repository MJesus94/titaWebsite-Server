const { Schema, model } = require("mongoose");

const panelasSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    imgUrl: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    price: { type: Number, required: true },
    cardSize: { type: String, required: true },
    color: { type: [String], required: true },
    massa: { type: String, required: true },
    cobertura: { type: String, required: true },
    formato: { type: String, required: true },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Panelas = model("Panelas", panelasSchema);

module.exports = Panelas;
