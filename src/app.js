import express from "express";
import cors from "cors";
const app = express();

export default app;


//cors confiuration

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") ||" http://localhost:5173",
  credentials: true,
  methods:["GET","PUT","PATCH","DELETE","OPTIONS","POST"],
 allowedHeaders: ["Content-Type", "Authorization"], 
}))

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

app.use(express.static("public"));

import healthcheckRoutes from "./routes/healthcheck.routes.js";
import authRoutes from "./routes/auth.routes.js";
app.use("/api/v1/healthcheck", healthcheckRoutes);

app.use("/api/v1/auth", authRoutes);



  app.get("/", (req, res) => {
    res.json({ server: "The server is running ✅  " });
  });


app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


