import { Router } from "express";
import {
  getNews,
  getHeroImage,
  getPhotos,
  getOverview,
} from "../controllers/places/places.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/news").get(verifyJWT, getNews);
router.route("/get-hero-image").get(verifyJWT, getHeroImage);
router.route("/get-photos").get(verifyJWT, getPhotos);
router.route("/get-overview").get(verifyJWT, getOverview);
export default router;
