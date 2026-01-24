import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

// ================= CORE TRIP =================
import {
  createTrip,
  getAllUserTripData,
  getPublicTripPreview,
  getTripActivities,
} from "../controllers/trip/trip.controller.js";

// ================= ITINERARY =================
import {
  addAiTripPlans,
  createTripPlan,
  deleteItineraryPlan,
  reorderTripPlans,
  updateItineraryPlan,
} from "../controllers/trip/itinerary.contoller.js";

// ================= GALLERY =================
import {
  deleteTripPhoto,
  downloadTripPhoto,
  getGlobalTripGallery,
  getMyLocalGallery,
  likeTripPhoto,
  pushPhotosToGlobal,
  togglePhotoDownload,
  unlikeTripPhoto,
  uploadTripPhotosBatch,
} from "../controllers/trip/tripGallary.controller.js";

// ================= WALLET =================
import {
  addExpense,
  assignAccountant,
  confirmSettlement,
  deleteExpense,
  generateSettlements,
  getTripWallet,
  getWalletExpenses,
  removeAccountant,
  setPersonalBudget,
  setTripBudget,
  updateExpense,
  updateWalletSettings,
} from "../controllers/trip/tripWallet.controller.js";

// ================= FAMOUS PLACES =================
import {
  addTripPlace,
  deleteTripPlace,
} from "../controllers/trip/tripFamousPlace.controller.js";

// ================= TRIP SETTINGS =================

import {
  addTripMember,
  assignTripRole,
  getTripCapabilities,
  leaveTrip,
  publishTripToCommunity,
  removeTripMember,
  removeTripRole,
  toggleTripVisibility,
  updateTripCover,
} from "../controllers/trip/tripSetting.controller.js";

const router = express.Router();

// 🔐 Auth (GLOBAL)
router.use(verifyJWT);

// =================================================
// TRIP
// =================================================
router.post("/createTrip", upload.single("coverPhoto"), createTrip);
router.get("/myTrips/data", getAllUserTripData);
router.get("/public/:tripId", getPublicTripPreview);
router.get("/trips/:tripId/activities", getTripActivities);

// =================================================
// ITINERARY
// =================================================
router.post("/trips/:tripId/itinerary", createTripPlan);
router.patch("/trips/:tripId/itinerary/reorder", reorderTripPlans);
router.post("/trips/:tripId/itinerary/ai", addAiTripPlans);
router.patch("/trips/editPlan/:planId", updateItineraryPlan);
router.delete("/trips/deletePlan/:planId", deleteItineraryPlan);

// =================================================
// GALLERY
// =================================================
router.post(
  "/trips/:tripId/gallery/upload",
  upload.array("photos", 20),
  uploadTripPhotosBatch,
);
router.get("/trips/:tripId/gallery/local", getMyLocalGallery);
router.get("/trips/:tripId/gallery/global", getGlobalTripGallery);
router.patch("/trips/:tripId/gallery/push", pushPhotosToGlobal);

router.post("/trip-gallery/:photoId/like", likeTripPhoto);
router.delete("/trip-gallery/:photoId/like", unlikeTripPhoto);
router.get("/trip-gallery/:photoId/download", downloadTripPhoto);
router.patch("/trip-gallery/:photoId/download-permission", togglePhotoDownload);
router.delete("/trip-gallery/:photoId", deleteTripPhoto);

// =================================================
// WALLET
// =================================================
router.get("/trips/:tripId/wallet", getTripWallet);
router.patch("/trips/:tripId/wallet/settings", updateWalletSettings);

router.post("/trips/:tripId/wallet/expenses", addExpense);
router.patch("/wallet/expenses/:expenseId", updateExpense);
router.delete("/wallet/expenses/:expenseId", deleteExpense);
router.get("/trips/:tripId/wallet/expenses", getWalletExpenses);

router.post("/trips/:tripId/wallet/settlements/generate", generateSettlements);
router.post(
  "/trips/:tripId/wallet/settlements/:settlementId/confirm/:type",
  confirmSettlement,
);

router.post("/trips/:tripId/wallet/accountants", assignAccountant);
router.delete("/trips/:tripId/wallet/accountants/:userId", removeAccountant);

router.post("/trips/:tripId/wallet/personal-budget", setPersonalBudget);
router.patch("/trips/:tripId/wallet/budget", setTripBudget);

// =================================================
// FAMOUS PLACES
// =================================================
router.post("/trips/:tripId/places", upload.single("image"), addTripPlace);
router.delete("/trips/:tripId/places/:placeId", deleteTripPlace);

// =================================================
// TRIP SETTINGS / MEMBERS / ROLES
// =================================================
router.patch("/trips/:tripId/visibility", toggleTripVisibility);
router.post("/trips/:tripId/members", addTripMember);
router.delete("/trips/:tripId/members/:memberId", removeTripMember);
router.post("/trips/:tripId/leave", leaveTrip);

router.post("/trips/:tripId/roles", assignTripRole);

router.patch(
  "/trips/:tripId/cover",
  upload.single("coverPhoto"),
  updateTripCover,
);

router.post("/trips/:tripId/publish/:communityId", publishTripToCommunity);

router.get("/trips/:tripId/capabilities", getTripCapabilities);
router.delete("/trips/:tripId/roles/:roleId", removeTripRole);

export default router;
