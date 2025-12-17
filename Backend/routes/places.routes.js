import { Router } from "express";
import { getNews } from "../controllers/places/places.controller.js";
import { getHeroImage } from "../controllers/places/places.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/news").get(verifyJWT, getNews);
router.route("/get-hero-image").get(verifyJWT, getHeroImage);

export default router;
