import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import {
  approveContribution,
  rejectContribution,
  setBackToPending,
  getContributions,
} from "../controllers/admin/verifyContribution.controller.js";
import {
  awardRandomPoints,
  searchUsers,
} from "../controllers/admin/awardRandomPoints.js";
import {
  permanentDeleteUser,
  promoteUserToAdmin,
  requestOtp,
  sendWarning,
  toggleUserBan,
} from "../controllers/admin/userManagement.controller.js";

const router = Router();
router.use(verifyJWT);

router.get(
  "/contributions",
  authorize("verify_contribution", "admin"),
  getContributions
);
router.patch(
  "/contributions/:contributionId/approve",
  authorize("verify_contribution", "admin"),
  approveContribution
);
router.patch(
  "/contributions/:contributionId/reject",
  authorize("verify_contribution", "admin"),
  rejectContribution
);
router.patch(
  "/contributions/:contributionId/pending",
  authorize("verify_contribution", "admin"),
  setBackToPending
);
router.post(
  "/award-random-points",
  authorize("award_points", "admin"),
  awardRandomPoints
);
router.get("/search-users", authorize("award_points", "admin"), searchUsers);
router.post(
  "/:userId/request-otp",
  authorize("promote_user", "admin"),
  requestOtp
);
router.post(
  "/promote-user/:userId",
  authorize("promote_user", "admin"),
  promoteUserToAdmin
);

router.post(
  "/toggle-user-ban/:userId",
  authorize("ban_user", "admin"),
  toggleUserBan
);

router.post(
  "/permanent-delete-user/:userId",
  authorize("permanent_delete_user", "admin"),
  permanentDeleteUser
);

router.post(
  "/send-warning/:userId",
  authorize("send_warning", "admin"),
  sendWarning
);
export default router;
