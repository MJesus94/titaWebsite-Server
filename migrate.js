const express = require("express");
const User = require("./models/User.model"); // Assuming this is how you import your User model

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Route to handle the update operation
app.post("/updateUsersWithAddress", async (req, res) => {
  try {
    const users = await User.find();
    for (const user of users) {
      user.address = {
        street: "Street Name",
        zipCode: "2725-999",
        city: "Lisboa",
      };
      await user.save();
    }
    console.log("All users updated with address");
    res.send("Update successful");
  } catch (error) {
    console.error("Error updating users:", error);
    res.status(500).send("Error updating users");
  }
});

// Start the server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
