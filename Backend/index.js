import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import authroutes from "./routes/auth.routes.js";
import chatbotRoute from "./routes/chatbot.routes.js";
import http from "http";
import { initSocket } from "./socket/server.js";
import communityRoute from "./routes/community.routes.js";

dotenv.config({});

const app = express();
const server = http.createServer(app);

// start socket
initSocket(server);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "I'm coming from backend",
    success: true,
  });
});
//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));
const corsOption = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOption));

//API routes
app.use("/api/auth", authroutes);
app.use("/api/community", communityRoute);
app.use("/api/chatbot", chatbotRoute);

app.listen(PORT, () => {
  connectDB();
  console.log(`Server listen at port ${PORT}`);
});
