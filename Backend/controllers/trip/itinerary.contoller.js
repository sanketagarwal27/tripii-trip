import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { Trip } from "../../models/trip/trip.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { TripPlan } from "../../models/trip/tripPlan.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { TripRole } from "../../models/trip/tripRole.model.js";
import { EVENTS } from "../../socket/events.js";
import { emitToTrip } from "../../socket/server.js";
import { User } from "../../models/user/user.model.js";
import { TripActivity } from "../../models/trip/tripActivity.model.js";

const toMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const normalizeSequences = async (tripId, date) => {
  const { start, end } = getDayRange(date);
  const plans = await TripPlan.find({
    trip: tripId,
    date: { $gte: start, $lte: end },
  }).sort({
    sequence: 1,
    "time.start": 1,
  });

  const bulkOps = plans.map((plan, idx) => ({
    updateOne: {
      filter: { _id: plan._id },
      update: { sequence: idx + 1 },
    },
  }));

  if (bulkOps.length) {
    await TripPlan.bulkWrite(bulkOps);
  }
};

const canManageItinerary = async ({ tripId, userId }) => {
  // 1️⃣ Captain always allowed
  const trip = await Trip.findById(tripId).select("createdBy");
  if (!trip) return false;

  if (trip.createdBy.equals(userId)) return true;

  // 2️⃣ Check planner role
  const plannerRole = await TripRole.findOne({
    trip: tripId,
    assignedTo: userId,
    roleName: "Planner",
    status: "active",
  });

  return !!plannerRole;
};

export const createTripPlan = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;

  const { title, description, date, time, location } = req.body;

  if (!title || !date) {
    throw new ApiError(400, "Title and date are required");
  }

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  const allowed = await canManageItinerary({
    tripId,
    userId,
  });

  if (!allowed) {
    throw new ApiError(403, "Only captain or planner can add itinerary plans");
  }

  const { start, end } = getDayRange(date);
  const sameDayPlans = await TripPlan.find({
    trip: tripId,
    date: { $gte: start, $lte: end },
  });

  let sequence;
  if (time?.start) {
    const startMinutes = toMinutes(time.start);

    const beforeCount = sameDayPlans.filter((p) => {
      if (!p.time?.start) return false;
      return toMinutes(p.time.start) <= startMinutes;
    }).length;

    sequence = beforeCount + 1;
  } else {
    sequence = sameDayPlans.length + 1;
  }

  const plan = await TripPlan.create({
    trip: tripId,
    title,
    description,
    date,
    time,
    location,
    createdBy: userId,
    sequence,
  });

  const updatedPlan = await plan.populate("createdBy", "username");

  // 🔥 Normalize sequences to avoid duplicates
  await normalizeSequences(tripId, date);

  const finalPlan = await TripPlan.findById(plan._id).populate(
    "createdBy",
    "username",
  );

  emitToTrip(tripId, EVENTS.ITINERARY_CREATED, { plan: finalPlan });

  /* ---------------- ACTIVITY (ENHANCED) ---------------- */
  const actorUser = await User.findById(userId).select("username");
  const planDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeStr = time?.start ? ` at ${time.start}` : "";
  const locationStr = location?.name ? ` in ${location.name}` : "";

  await TripActivity.create({
    trip: tripId,
    type: "plan_added",
    actor: userId,
    targetId: plan._id,
    targetModel: "TripPlan",
    description: `${actorUser.username} added "${title}" to itinerary for ${planDate}${timeStr}${locationStr}`,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { plan: updatedPlan },
        "Trip plan created successfully",
      ),
    );
});

export const reorderTripPlans = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { date, orderedPlanIds } = req.body;
  const userId = req.user._id;

  if (!date || !Array.isArray(orderedPlanIds)) {
    throw new ApiError(400, "date and orderedPlanIds are required");
  }

  if (!orderedPlanIds.length) {
    throw new ApiError(400, "No plans provided for reorder");
  }

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  const allowed = await canManageItinerary({
    tripId,
    userId,
  });

  if (!allowed) {
    throw new ApiError(403, "Only captain or planner can reorder itinerary");
  }

  const { start, end } = getDayRange(date);

  const count = await TripPlan.countDocuments({
    trip: tripId,
    date: { $gte: start, $lte: end },
    _id: { $in: orderedPlanIds },
  });

  if (count !== orderedPlanIds.length) {
    throw new ApiError(400, "Invalid plan list");
  }

  const bulkOps = orderedPlanIds.map((planId, index) => ({
    updateOne: {
      filter: {
        _id: planId,
        trip: tripId,
        date: { $gte: start, $lte: end },
      },
      update: { sequence: index + 1 },
    },
  }));

  await TripPlan.bulkWrite(bulkOps);

  emitToTrip(tripId, EVENTS.ITINERARY_REORDERED, {
    date,
    orderedPlanIds,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Itinerary reordered successfully"));
});

export const addAiTripPlans = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;
  const { days } = req.body;

  if (!Array.isArray(days)) {
    throw new ApiError(400, "Invalid AI plan format");
  }

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  // 🔐 Permission
  const allowed = await canManageItinerary({ tripId, userId });
  if (!allowed) {
    throw new ApiError(
      403,
      "Only captain or planner can add AI itinerary plans",
    );
  }

  // ⛔ BLOCK EXPIRED TRIPS
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const tripEnd = new Date(trip.endDate);

  if (tripEnd < endOfToday) {
    throw new ApiError(
      400,
      "Trip has already ended. Itinerary cannot be modified.",
    );
  }

  const createdPlans = [];

  for (const dayBlock of days) {
    const { day, plans } = dayBlock;
    if (!day || !Array.isArray(plans)) continue;

    // 🔥 Convert day number → actual date
    const date = new Date(trip.startDate);
    date.setDate(date.getDate() + (day - 1));

    // Find existing plans for that day
    const { start, end } = getDayRange(date);
    const existingPlans = await TripPlan.find({
      trip: tripId,
      date: { $gte: start, $lte: end },
    });

    let baseSequence = existingPlans.length;

    for (let i = 0; i < plans.length; i++) {
      const p = plans[i];

      const plan = await TripPlan.create({
        trip: tripId,
        title: p.title,
        description: p.description,
        date,
        time: p.time,
        location: p.location,
        createdBy: userId,
        addedBy: "sunday_ai",
        aiMetadata: {
          reason: p.reason || "AI suggested itinerary",
          confidence: p.confidence ?? 0.8,
        },
        sequence: baseSequence + i + 1,
      });

      createdPlans.push(plan);
    }

    // 🔁 Normalize after each day
    await normalizeSequences(tripId, date);
  }

  /* ---------------- ACTIVITY (ENHANCED) ---------------- */
  const actorUser = await User.findById(userId).select("username");
  const planCount = createdPlans.length;
  const dayCount = days.length;

  await TripActivity.create({
    trip: tripId,
    type: "plan_added",
    actor: userId,
    targetModel: "TripPlan",
    description: `${actorUser.username} added ${planCount} AI-generated plans across ${dayCount} days`,
  });

  emitToTrip(tripId, EVENTS.ITINERARY_AI_ADDED, {
    plans: createdPlans,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { plans: createdPlans },
        "AI trip plans added successfully",
      ),
    );
});

// For editing trip plan
export const updateItineraryPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const userId = req.user._id;
  const updates = req.body;

  if (!planId) {
    throw new ApiError(400, "Plan ID is required");
  }

  const plan = await TripPlan.findById(planId);
  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  const trip = await Trip.findById(plan.trip);
  if (!trip) {
    throw new ApiError(404, "Trip not found");
  }

  const allowed = await canManageItinerary({
    tripId: plan.trip,
    userId,
  });

  if (!allowed) {
    throw new ApiError(403, "Only captain or planner can edit itinerary plans");
  }

  /* ---------------- SAFE FIELD UPDATES ---------------- */

  const allowedFields = [
    "title",
    "description",
    "date",
    "sequence",
    "time",
    "location",
    "weatherReason",
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      plan[field] = updates[field];
    }
  });

  await plan.save();

  // ✅ Populate ONLY the updated plan
  const populatedPlan = await TripPlan.findById(plan._id).populate(
    "createdBy",
    "username",
  );

  /* ---------------- ACTIVITY (ENHANCED) ---------------- */
  const actorUser = await User.findById(userId).select("username");

  // Build change summary
  const changes = [];
  if (updates.title) changes.push("title");
  if (updates.description) changes.push("description");
  if (updates.date) changes.push("date");
  if (updates.time) changes.push("time");
  if (updates.location) changes.push("location");

  const changeStr =
    changes.length > 0 ? ` (updated ${changes.join(", ")})` : "";

  await TripActivity.create({
    trip: trip._id,
    type: "plan_updated",
    actor: userId,
    targetId: plan._id,
    targetModel: "TripPlan",
    description: `${actorUser.username} updated plan "${plan.title}"${changeStr}`,
  });

  // ✅ Emit correct payload shape
  emitToTrip(trip._id, EVENTS.ITINERARY_UPDATED, {
    plan: populatedPlan,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        populatedPlan,
        "Itinerary plan updated successfully",
      ),
    );
});

export const deleteItineraryPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const userId = req.user._id;

  /* ---------------- VALIDATION ---------------- */
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    throw new ApiError(400, "Invalid plan id");
  }

  const plan = await TripPlan.findById(planId);
  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  const trip = await Trip.findById(plan.trip);
  if (!trip) {
    throw new ApiError(404, "Trip not found");
  }

  /* ---------------- AUTHORIZATION ---------------- */
  const allowed = await canManageItinerary({
    tripId: plan.trip,
    userId,
  });

  if (!allowed) {
    throw new ApiError(
      403,
      "Only captain or planner can delete itinerary plans",
    );
  }

  /* ---------------- DELETE + RESEQUENCE ---------------- */
  const deletedDate = plan.date;
  const deletedSequence = plan.sequence;
  const tripId = plan.trip;

  // 1️⃣ Delete the plan
  await plan.deleteOne();

  // 2️⃣ Fix sequence order for the same day
  const { start, end } = getDayRange(deletedDate);

  const plansToFix = await TripPlan.find({
    trip: tripId,
    date: { $gte: start, $lte: end },
    sequence: { $gt: deletedSequence },
  });

  if (plansToFix.length) {
    const bulkOps = plansToFix.map((p) => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $inc: { sequence: -1 } },
      },
    }));

    await TripPlan.bulkWrite(bulkOps);
  }

  emitToTrip(trip._id, EVENTS.ITINERARY_DELETED, { planId });

  /* ---------------- ACTIVITY (ENHANCED) ---------------- */
  const actorUser = await User.findById(userId).select("username");
  const planTitle = plan.title;
  const planDate = new Date(deletedDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  await TripActivity.create({
    trip: trip._id,
    type: "plan_deleted",
    actor: userId,
    targetId: planId,
    targetModel: "TripPlan",
    description: `${actorUser.username} removed "${planTitle}" from ${planDate} itinerary`,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { planId }, "Itinerary plan deleted successfully"),
    );
});
