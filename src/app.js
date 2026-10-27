import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

export default app;

//cors confiuration

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "PUT", "PATCH", "DELETE", "OPTIONS", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// basic configuration

app.use(
  express.json({
    limit: "16kb",
  }),
);

app.use(
  express.urlencoded({
    limit: "16kb",
    extended: true,
  }),
);

//serves static assests in public folder
app.use(express.static("public"));

// cookie parser

app.use(cookieParser());

import healthcheckRoutes from "./routes/healthcheck.routes.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.route.js";
import taskroutes from "./routes/tasks.routes.js"
import subtaskRoutes from "./routes/subtask.routes.js";
import noteRoutes from "./routes/note.routes.js";
app.use("/api/v1/healthcheck", healthcheckRoutes);
app.use("/api/v1/task", taskroutes);
app.use("/api/v1/task", subtaskRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/project", projectRoutes);
app.use("/api/v1/notes/", noteRoutes);

app.get("/", (req, res) => {
  res.json({ server: "The server is running ✅  " });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || error.status || 500;
  if (statusCode >= 500) {
    console.error(
      `Unhandled error for ${req.method} ${req.originalUrl}:`,
      error,
    );
  }

  const isMalformedJson = error.type === "entity.parse.failed";
  const message = isMalformedJson
    ? "Request body contains invalid JSON"
    : statusCode < 500
      ? error.message
      : "Internal server error";

  res.status(statusCode).json({
    statusCode,
    message,
    success: false,
    errors: error.errors || [],
  });
});
