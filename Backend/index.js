// index.js — main server entry
import "dotenv/config"; // Must be the very first import to fix ES module hoisting issues
import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import helmet from "helmet";

// Database
import connectDB from "./utils/db.js";

// Routes
import authroutes from "./routes/auth.routes.js";
import communityRoute from "./routes/community.routes.js";
import postRoute from "./routes/post.routes.js";
import chatbotRoute from "./routes/chatbot.routes.js";
import placesRoute from "./routes/places.routes.js";
import tripRoute from "./routes/trip.routes.js";
import contributionRoute from "./routes/contribution.routes.js";
import { initSocket } from "./socket/server.js";
import adminRoutes from "./routes/admin.routes.js";
import businessRoutes from "./routes/business.routes.js";

const app = express();
const server = http.createServer(app);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  "https://tripii-trip-black.vercel.app",
].filter(Boolean); // remove undefined/empty strings

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["set-cookie"],
  }),
);

// Handle preflight for ALL routes — regex form required by newer path-to-regexp
app.options(/.*/, cors());

/* -------------------------------------------------------
   BODY PARSING & COOKIES
-------------------------------------------------------- */
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

initSocket(server);

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.status(200).json({
    message: "TripiiTrip API is running",
    success: true,
  });
});

// API Routes
app.use("/api/auth", authroutes);
app.use("/api/community", communityRoute);
app.use("/api/post", postRoute);
app.use("/api/chatbot", chatbotRoute);
app.use("/api/places", placesRoute);
app.use("/api/trip", tripRoute);
app.use("/api/contribution", contributionRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/businesslisting", businessRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

/* -------------------------------------------------------
   GLOBAL ERROR HANDLER
   Must be the LAST middleware. Catches all errors passed
   via next(err) — returns consistent JSON.
-------------------------------------------------------- */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  // Don't expose stack traces in production
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
});

server.listen(PORT, () => {
  connectDB();
  console.log(`Server listening at port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
