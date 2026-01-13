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
  getRewardHistory,
  searchUsers,
} from "../controllers/admin/awardRandomPoints.js";
import {
  getUserStats,
  permanentDeleteUser,
  promoteUserToAdmin,
  requestOtp,
  sendWarning,
  toggleUserBan,
} from "../controllers/admin/userManagement.controller.js";
import {
  approveBusinessListing,
  getAllBusinessListingsForAdmin,
  getBusinessListingByIdForAdmin,
  getPendingBusinessListings,
  pendingWithEmail,
  rejectBusinessListing,
} from "../controllers/admin/businessManagement.controller.js";
import { getAppOverview } from "../controllers/admin/appOverview.controller.js";
import {
  deleteCommunity,
  getAllCommunities,
  updateCommunityStatus,
  verifyCommunity,
} from "../controllers/admin/communityManagement.controller.js";

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

router.get(
  "/get-reward-history",
  authorize("view_rewards_history", "admin"),
  getRewardHistory
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

/**
 * ================================
 * BUSINESS LISTING VERIFICATION
 * ================================
 */

// Get all business listing submissions (with filters)
router.get(
  "/business-listings",
  authorize("verify_business_listing", "admin"),
  getAllBusinessListingsForAdmin
);

// Get only pending / under-review listings
router.get(
  "/business-listings/pending",
  authorize("verify_business_listing", "admin"),
  getPendingBusinessListings
);

// Get full details of a single business listing
router.get(
  "/business-listings/:businessListingId",
  authorize("verify_business_listing", "admin"),
  getBusinessListingByIdForAdmin
);

// Approve business listing (creates public Listing)
router.patch(
  "/business-listings/:businessListingId/approve",
  authorize("verify_business_listing", "admin"),
  approveBusinessListing
);

// Reject business listing
router.patch(
  "/business-listings/:businessListingId/reject",
  authorize("verify_business_listing", "admin"),
  rejectBusinessListing
);

// Mark pending + send custom email to owner
router.patch(
  "/business-listings/:businessListingId/pending",
  authorize("verify_business_listing", "admin"),
  pendingWithEmail
);

router.get(`/user-stats`, authorize("view_users_stats", "admin"), getUserStats);

router.get(
  "/app-overview",
  authorize("view_app_overview", "admin"),
  getAppOverview
);

router.get(
  "/get-communities",
  authorize("manage_communities", "admin"),
  getAllCommunities
);

router.patch(
  "/verify-community/:id",
  authorize("manage_communities", "admin"),
  verifyCommunity
);

router.patch(
  "/update-community-status/:id",
  authorize("manage_communities", "admin"),
  updateCommunityStatus
);

router.delete(
  "/delete-community/:id",
  authorize("manage_communities", "admin"),
  deleteCommunity
);

export default router;
