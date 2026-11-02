import app, { allowedOrigins } from "./app.js";
import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./db/connectDB.js";
import { initSocket } from "./socket/index.js";
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer, allowedOrigins);

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server is running on: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error starting the server:", err);
    process.exit(1);
  });
