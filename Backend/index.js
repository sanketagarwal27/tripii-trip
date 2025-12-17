// index.js or app.js (main server file)
import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";

// Database
import connectDB from "./utils/db.js";

// Routes
import authroutes from "./routes/auth.routes.js";
import communityRoute from "./routes/community.routes.js";
import postRoute from "./routes/post.routes.js";
import chatbotRoute from "./routes/chatbot.routes.js";
import placesRoute from "./routes/places.routes.js";
import { initSocket } from "./socket/server.js";

dotenv.config({});

const app = express();
const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 8000;
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

const corsOption = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOption));
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "I'm coming from backend",
    success: true,
  });
});

// API Routes
app.use("/api/auth", authroutes);
app.use("/api/community", communityRoute);
app.use("/api/post", postRoute);
app.use("/api/chatbot", chatbotRoute);
app.use("/api/places", placesRoute);

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
