// index.js

import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";

import connectDB from "./utils/db.js";

import authroutes from "./routes/auth.routes.js";
import communityRoute from "./routes/community.routes.js";
import postRoute from "./routes/post.routes.js";
import chatbotRoute from "./routes/chatbot.routes.js";
import placesRoute from "./routes/places.routes.js";
import tripRoute from "./routes/trip.routes.js";
import contributionRoute from "./routes/contribution.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// 🔥 REQUIRED for Render + cookies
app.set("trust proxy", 1);

/* ✅ CORS MUST BE FIRST - ENHANCED */
app.use(
  cors({
    origin: ["http://localhost:5173", "https://tripii-trip-black.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["set-cookie"],
  })
);

// ✅ Handle preflight requests globally
app.options("*", cors());

/* ✅ THEN other middleware */
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

initSocket(server);

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.status(200).json({
    message: "I'm coming from backend",
    success: true,
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authroutes);
app.use("/api/community", communityRoute);
app.use("/api/post", postRoute);
app.use("/api/chatbot", chatbotRoute);
app.use("/api/places", placesRoute);
app.use("/api/trip", tripRoute);
app.use("/api/contribution", contributionRoute);
app.use("/api/admin", adminRoutes);

/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  const origin = req.headers.origin;

  if (
    origin &&
    (origin.endsWith(".vercel.app") || origin === "http://localhost:5173")
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  console.error("ERROR:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* ================= SERVER ================= */

server.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
});
