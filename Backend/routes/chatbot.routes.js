import { Router } from "express";
import { getChatbotResponse } from "../controllers/chatbot/chatbot.controller.js";
// Optional : To require only logged in user to access the chatbot
// import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
// router.route("/").post(verifyJWT, );
router.route("/").post(getChatbotResponse); //Remove it if authentication is needed

export default router;