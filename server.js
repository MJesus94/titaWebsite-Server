const app = require("./app");
/* const helmet = require("helmet"); */

// ℹ️ Sets the PORT for our app to have access to it. If no env has been set, we hard code it to 5005
const PORT = process.env.PORT || 5005;

// Set Content Security Policy
/* app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://apis.google.com"],
      imgSrc: ["'self'", "https://res.cloudinary.com"],  // Add Cloudinary domain
    },
  })
); */

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
