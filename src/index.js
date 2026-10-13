import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error starting the server:", err);
    process.exit(1);
  });
