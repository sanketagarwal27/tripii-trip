import { Router } from "express";
import getNews from "../controllers/places/news.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(verifyJWT, getNews);
export default router;
