import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addContribution } from "../controllers/contribution/contribution.controller.js";

const router = Router();
router.route("/add").post(verifyJWT, addContribution);
// router.route("/get-drafts").get(verifyJWT, getDrafts);
// router.route("/get-submitted").get(verifyJWT, getSubmittedContributions);
export default router;
