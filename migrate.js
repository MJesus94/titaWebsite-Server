const User = require("./models/User.model"); // Assuming this is how you import your User model

const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/titaWebsite", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

async function updateUsersWithAddress() {
  try {
    const users = await User.find(); // Retrieve all users
    console.log(users);
    for (const user of users) {
      user.address = {
        street: "Street Name",
        zipCode: "2725-999",
        city: "Lisboa",
      };
      await user.save(); // Save the updated user
      console.log("here");
    }
    console.log("All users updated with address");
  } catch (error) {
    console.error("Error updating users:", error);
  }
}

updateUsersWithAddress();
