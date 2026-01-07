import mongoose from "mongoose";
import { Trip } from "../../models/trip/trip.model.js";
import { TripWallet } from "../../models/trip/tripWallet.model.js";
import { TripChecklist } from "../../models/trip/tripChecklist.model.js";
import { TripActivity } from "../../models/trip/tripActivity.model.js";
import { User } from "../../models/user/user.model.js";
import { Notification } from "../../models/user/notification.model.js";
import { Expense } from "../../models/trip/expense.model.js";
import { TripPlan } from "../../models/trip/tripPlan.model.js";
import { TripClosure } from "../../models/trip/tripClosure.model.js";
import { TripPhoto } from "../../models/trip/tripPhoto.model.js";
import { TripPlace } from "../../models/trip/tripPlace.model.js";
import { TripRole } from "../../models/trip/tripRole.model.js";

import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { emitToUser } from "../../socket/server.js";
import cloudinary from "../../utils/cloudinary.js";
import getDataUri from "../../utils/datauri.js";
import { optimizeImageBuffer } from "../../utils/sharpImage.js";

/* ============================================================
   🔥 HELPER: UPLOAD TRIP COVER IMAGE
============================================================ */
const uploadCoverImageForTrip = async (file, tripId) => {
  if (!file) return null;

  const optimizedBuffer = await optimizeImageBuffer(file.buffer, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 82,
  });

  const uri = getDataUri({
    buffer: optimizedBuffer,
    mimetype: "image/jpeg",
  });

  const uploaded = await cloudinary.uploader.upload(uri.content, {
    folder: `trips/${tripId}/cover`,
    public_id: "main",
    overwrite: true,
    invalidate: true,
    resource_type: "image",
    transformation: [
      { width: 1280, height: 720, crop: "fill", gravity: "center" },
      { fetch_format: "auto" },
    ],
  });

  return {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

/* ============================================================
   ✅ CREATE TRIP (FINAL)
============================================================ */
export const createTrip = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;

    const {
      title,
      description,
      type,
      startDate,
      endDate,
      visibility = "private",
      invitedUsers = [],
    } = req.body;

    const location = {
      city: req.body.city?.trim(),
      state: req.body.state?.trim(),
      country: req.body.country?.trim(),
    };

    /* ---------------- VALIDATION ---------------- */
    const missingFields = [];

    if (!title) missingFields.push("title");
    if (!type) missingFields.push("type");
    if (!startDate) missingFields.push("startDate");
    if (!endDate) missingFields.push("endDate");
    if (!location?.city) missingFields.push("location.city");

    if (missingFields.length > 0) {
      throw new ApiError(
        400,
        `Missing required trip fields: ${missingFields.join(", ")}`
      );
    }

    /* ---------------- 1️⃣ CREATE TRIP ---------------- */
    const [trip] = await Trip.create(
      [
        {
          title,
          description,
          type,
          startDate,
          endDate,
          location,
          visibility,
          createdBy: userId,
          participants: [userId],
        },
      ],
      { session }
    );

    /* ---------------- 2️⃣ UPLOAD COVER PHOTO (OPTIONAL) ---------------- */
    if (req.file) {
      const cover = await uploadCoverImageForTrip(req.file, trip._id);
      trip.coverPhoto = cover;
      await trip.save({ session });
    }

    /* ---------------- 3️⃣ CREATE WALLET ---------------- */
    const [wallet] = await TripWallet.create(
      [
        {
          trip: trip._id,
          manager: userId,
          participants: [userId],
        },
      ],
      { session }
    );

    trip.wallet = [wallet._id];
    await trip.save({ session });

    /* ---------------- 4️⃣ ADD TRIP TO USER ---------------- */
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { trips: trip._id } },
      { session }
    );

    /* ---------------- 5️⃣ INJECT BASE CHECKLIST ---------------- */
    const baseChecklist =
      type === "international"
        ? [
            "Passport",
            "Visa",
            "Forex / International Card",
            "Travel Insurance",
            "Power Adapter",
            "SIM / Roaming",
          ]
        : ["Government ID", "Cash / UPI", "Medicines", "Emergency Contacts"];

    const checklistDocs = baseChecklist.map((item) => ({
      trip: trip._id,
      item,
      createdBy: userId,
      addedBy: "user",
      sortWeight: 1,
    }));

    await TripChecklist.insertMany(checklistDocs, { session });

    /* ---------------- 6️⃣ ACTIVITY ---------------- */
    await TripActivity.create(
      [
        {
          trip: trip._id,
          type: "trip_created",
          actor: userId,
          description: `Trip created for ${location.city}`,
        },
      ],
      { session }
    );

    /* ---------------- 7️⃣ SEND INVITES (PENDING) ---------------- */
    if (Array.isArray(invitedUsers) && invitedUsers.length) {
      const notifications = invitedUsers
        .filter((uid) => uid.toString() !== userId.toString())
        .map((inviteeId) => ({
          recipient: inviteeId,
          sender: userId,
          type: "trip_invite",
          message: "invited you to join a trip",
          trip: trip._id,
          metadata: { actionStatus: "pending" },
        }));

      if (notifications.length) {
        const createdNotis = await Notification.insertMany(notifications, {
          session,
        });

        createdNotis.forEach((n) =>
          emitToUser(n.recipient, "new_notification", n)
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Populate trip for frontend
    const populatedTrip = await Trip.findById(trip._id).lean();

    return res
      .status(201)
      .json(new ApiResponse(201, populatedTrip, "Trip created successfully"));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

/* ============================================================
   ✅ GET ALL USER TRIPS (FIXED: SEARCH ALL, PAGINATE DISPLAY)
============================================================ */
export const getAllUserTripData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 15, 30);
  const search = req.query.search?.trim();

  // 1️⃣ Fetch user's trip IDs
  const user = await User.findById(userId).select("trips").lean();
  const userTripIds = user?.trips || [];

  if (!userTripIds.length) {
    return res.status(200).json({
      success: true,
      page,
      totalTrips: 0,
      hasMore: false,
      data: {
        trips: [],
        expenses: [],
        tripPlans: [],
        tripActivities: [],
        tripChecklists: [],
        tripClosures: [],
        tripPlaces: [],
        tripRoles: [],
        tripWallets: [],
      },
    });
  }

  // 2️⃣ Build trip query
  const tripQuery = {
    _id: { $in: userTripIds },
  };

  // 3️⃣ If searching, search ALL trips (not just current page)
  if (search) {
    tripQuery.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { "location.city": { $regex: search, $options: "i" } },
      { "location.state": { $regex: search, $options: "i" } },
      { "location.country": { $regex: search, $options: "i" } },
    ];
  }

  // 4️⃣ Count total matching trips
  const totalTrips = await Trip.countDocuments(tripQuery);

  // 5️⃣ Fetch paginated trips
  const trips = await Trip.find(tripQuery)
    .populate("createdBy", "username")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const pageTripIds = trips.map((t) => t._id);

  // 6️⃣ Fetch related data ONLY for current page trips
  const [
    expenses,
    tripPlans,
    tripActivities,
    tripChecklists,
    tripClosures,
    tripPlaces,
    tripRoles,
    tripWallets,
  ] = await Promise.all([
    Expense.find({ trip: { $in: pageTripIds } }).lean(),
    TripPlan.find({ trip: { $in: pageTripIds } })
      .populate("createdBy", "username")
      .lean(),
    TripActivity.find({ trip: { $in: pageTripIds } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    TripChecklist.find({ trip: { $in: pageTripIds } }).lean(),
    TripClosure.find({ trip: { $in: pageTripIds } }).lean(),
    TripPlace.find({ trip: { $in: pageTripIds } }).lean(),
    TripRole.find({ trip: { $in: pageTripIds } }).lean(),
    TripWallet.find({ trip: { $in: pageTripIds } }).lean(),
  ]);

  // 7️⃣ Respond
  res.status(200).json({
    success: true,
    page,
    totalTrips,
    hasMore: page * limit < totalTrips,
    serverTime: Date.now(),
    data: {
      trips,
      expenses,
      tripPlans,
      tripActivities,
      tripChecklists,
      tripClosures,
      tripPlaces,
      tripRoles,
      tripWallets,
    },
  });
});
