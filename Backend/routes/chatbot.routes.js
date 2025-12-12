import { Router } from "express";
import { getChatbotResponse, saveChatHistory, getChatHistory} from "../controllers/chatbot/chatbot.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, getChatbotResponse);
router.route("/save").post(verifyJWT, saveChatHistory);
router.route("/history").get(verifyJWT, getChatHistory);

export default router;