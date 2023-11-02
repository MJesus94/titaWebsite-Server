const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    name: {
      type: String,
      required: [true, "Name is required."],
    },
    address: { street: String, zipCode: String, city: String },
    phoneNumber: { type: String },
    imgUrl: {
      type: String,
      default:
        "https://res.cloudinary.com/df3vc4osi/image/upload/v1684236881/titaWebsite/star-wars-is-grogu-related-to-yoda_pe3x9t.webp",
    },
    favourites: [
      { type: Schema.Types.ObjectId, ref: "Pinceis" },
      { type: Schema.Types.ObjectId, ref: "Linhas" },
      { type: Schema.Types.ObjectId, ref: "Panelas" },
    ],
    admin: { type: String },
    confirmationCode: { type: String },
    isEmailConfirmed: { type: Boolean },
    recoveryPasswordCode: { type: String },
    isCodeConfirmed: { type: Boolean },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    refreshToken: String,
    authToken: String,
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;
