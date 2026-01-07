import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
  createTrip,
  getAllUserTripData,
  getPublicTripPreview,
} from "../controllers/trip/trip.controller.js";
import {
  addAiTripPlans,
  createTripPlan,
  deleteItineraryPlan,
  // getTripItinerary,
  reorderTripPlans,
  updateItineraryPlan,
} from "../controllers/trip/itinerary.contoller.js";
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
import {
  addTripPlace,
  deleteTripPlace,
} from "../controllers/trip/tripFamousPlace.controller.js";

const router = express.Router();

// 🔐 Auth
router.use(verifyJWT);

// ================= TRIP ROUTES =================
router.post("/createTrip", upload.single("coverPhoto"), createTrip);
router.get("/myTrips/data", getAllUserTripData);

// ================= ITINERARY ROUTES =================
// router.get("/trips/:tripId/itinerary", getTripItinerary);
router.post("/trips/:tripId/itinerary", createTripPlan);
router.patch("/trips/:tripId/itinerary/reorder", reorderTripPlans);
router.post("/trips/:tripId/itinerary/ai", addAiTripPlans);
router.patch("/trips/editPlan/:planId", updateItineraryPlan);

router.delete("/trips/deletePlan/:planId", deleteItineraryPlan);

// trip gallary
// ================= TRIP GALLERY ROUTES =================

// 📤 Upload photo (LOCAL by default)
router.post(
  "/trips/:tripId/gallery/upload",
  upload.array("photos", 20),
  uploadTripPhotosBatch
);
router.get("/trips/:tripId/gallery/local", getMyLocalGallery);
router.get("/trips/:tripId/gallery/global", getGlobalTripGallery);
router.patch("/trips/:tripId/gallery/push", pushPhotosToGlobal);
router.post("/trip-gallery/:photoId/like", likeTripPhoto);
router.delete("/trip-gallery/:photoId/like", unlikeTripPhoto);
router.get("/trip-gallery/:photoId/download", downloadTripPhoto);
router.patch("/trip-gallery/:photoId/download-permission", togglePhotoDownload);
router.delete("/trip-gallery/:photoId", deleteTripPhoto);

// wallet

router.get("/trips/:tripId/wallet", getTripWallet);
router.patch("/trips/:tripId/wallet/settings", updateWalletSettings);
router.post("/trips/:tripId/wallet/expenses", addExpense);
router.patch("/wallet/expenses/:expenseId", updateExpense);
router.delete("/wallet/expenses/:expenseId", deleteExpense);
router.get("/trips/:tripId/wallet/expenses", getWalletExpenses);
router.post("/trips/:tripId/wallet/settlements/generate", generateSettlements);
// Confirm settlement (payer / receiver)
router.post(
  "/trips/:tripId/wallet/settlements/:settlementId/confirm/:type",
  confirmSettlement
);
router.post("/trips/:tripId/wallet/accountants", assignAccountant);
router.delete("/trips/:tripId/wallet/accountants/:userId", removeAccountant);
router.post("/trips/:tripId/wallet/personal-budget", setPersonalBudget);
router.patch("/trips/:tripId/wallet/budget", setTripBudget);

// ➕ Add famous place (Captain / Planner)
router.post("/trips/:tripId/places", upload.single("image"), addTripPlace);

// 🗑 Delete famous place (Captain / Planner)
router.delete("/trips/:tripId/places/:placeId", deleteTripPlace);
router.get("/public/:tripId", getPublicTripPreview);

export default router;
