// import { Expense } from "../models/expense.model.js";
import { TripActivity } from "../../models/trip/tripActivity.model.js";
import { Trip } from "../../models/trip/trip.model.js";
import { TripRole } from "../../models/trip/tripRole.model.js";

import asyncHandler from "../../utils/asyncHandler.js";
import { awardPoints } from "../../points/awardPoints.js";
import { Expense } from "../../models/trip/expense.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { emitToTrip } from "../../socket/server.js";
import { EVENTS } from "../../socket/events.js";
import { sendNotification } from "../user/notification.controller.js";
import { TripWallet } from "../../models/trip/tripWallet.model.js";
import mongoose from "mongoose";
import { User } from "../../models/user/user.model.js";

async function canUserAddExpense({ userId, trip, wallet }) {
  if (trip.status === "completed") return false;

  if (trip.createdBy.toString() === userId.toString()) return true;

  if (wallet.settings.expensePermission === "all") return true;

  return TripRole.exists({
    trip: trip._id,
    assignedTo: userId,
    roleName: "Accountant",
    status: "active",
  });
}

// Helper function to extract user ID from participant subdocument
const resolveParticipantUserId = (participant) => {
  if (!participant) return null;

  // NEW FORMAT with POPULATED user: { user: { _id, username }, status: "active" }
  if (participant.user?._id) {
    return participant.user._id.toString();
  }

  // NEW FORMAT: { user: ObjectId, status: "active", ... }
  if (participant.user) {
    return participant.user.toString();
  }

  // OLD FORMAT: Just the ObjectId directly
  if (participant instanceof mongoose.Types.ObjectId) {
    return participant.toString();
  }

  // OLD FORMAT: If it has _id directly (shouldn't happen, but safe)
  if (participant._id && !participant.user) {
    return participant._id.toString();
  }

  return null;
};

const isUserTripParticipant = ({ trip, userId }) => {
  // Check if user is the creator
  if (trip.createdBy.toString() === userId.toString()) {
    return true;
  }

  // Check participants array
  return trip.participants.some((p) => {
    // NEW FORMAT: Check status
    if (p.status && p.status !== "active") {
      return false;
    }

    const pid = resolveParticipantUserId(p);
    return pid && pid === userId.toString();
  });
};

const syncWalletParticipantsWithTrip = async ({ trip, wallet }) => {
  const walletUserIds = wallet.participants.map((p) => p.user.toString());
  let changed = false;

  for (const p of trip.participants) {
    // NEW FORMAT: Skip non-active participants
    if (p.status && p.status !== "active") {
      continue;
    }

    const uid = resolveParticipantUserId(p);
    if (!uid) continue;

    if (!walletUserIds.includes(uid)) {
      wallet.participants.push({
        user: uid,
        personalBudget: 0,
        totalPaid: 0,
        totalOwes: 0,
        totalOwed: 0,
      });
      changed = true;
    }
  }

  if (changed) {
    await wallet.save();
  }
};

export const getTripWallet = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;

  console.log("\n" + "=".repeat(50));
  console.log("🔍 WALLET ACCESS DEBUG");
  console.log("=".repeat(50));
  console.log("📍 Trip ID:", tripId);
  console.log("👤 User ID:", userId.toString());

  // 1️⃣ Fetch trip WITH POPULATED PARTICIPANTS
  const trip = await Trip.findById(tripId).populate(
    "participants.user",
    "_id username",
  );

  if (!trip) {
    console.log("❌ Trip not found");
    throw new ApiError(404, "Trip not found");
  }

  console.log("✅ Trip found:", trip.title);
  console.log("👑 Creator ID:", trip.createdBy.toString());

  // Check if user is participant
  const isCreator = trip.createdBy.toString() === userId.toString();

  const isParticipant = trip.participants.some((p) => {
    const participantUserId = p.user?._id?.toString() || p.user?.toString();
    const isActive = p.status === "active";
    const matches = participantUserId === userId.toString();

    console.log(
      `   Checking: ${participantUserId} === ${userId.toString()} ? ${matches} (status: ${
        p.status
      })`,
    );

    return isActive && matches;
  });

  console.log("\n🔐 Access Check:");
  console.log("   Is Creator:", isCreator);
  console.log("   Is Participant:", isParticipant);
  console.log("   Has Access:", isCreator || isParticipant);
  console.log("=".repeat(50) + "\n");

  if (!isCreator && !isParticipant) {
    throw new ApiError(403, "Not a trip participant");
  }

  // 2️⃣ Fetch or create wallet
  let wallet = await TripWallet.findOne({ trip: tripId });

  if (!wallet) {
    console.log("🆕 Creating new wallet for trip");

    const activeParticipants = trip.participants
      .filter((p) => p.status === "active")
      .map((p) => ({
        user: p.user?._id || p.user,
        personalBudget: 0,
        totalPaid: 0,
        totalOwes: 0,
        totalOwed: 0,
      }));

    wallet = await TripWallet.create({
      trip: tripId,
      manager: trip.createdBy,
      participants: activeParticipants,
      budget: 0,
      totalSpend: 0,
      settings: { expensePermission: "all" },
    });
  }

  // 3️⃣ Sync wallet participants with active trip participants
  await syncWalletParticipantsWithTrip({ trip, wallet });

  // 4️⃣ Reload wallet with populated users
  wallet = await TripWallet.findById(wallet._id)
    .populate("participants.user", "_id username profilePicture.url")
    .lean();

  // 5️⃣ Response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        wallet: {
          _id: wallet._id,
          manager: wallet.manager,
          budget: wallet.budget,
          totalSpend: wallet.totalSpend,
          settings: wallet.settings,
        },
        participants: wallet.participants.map((p) => ({
          _id: p.user._id,
          username: p.user.username,
          profilePicture: p.user?.profilePicture,
          personalBudget: p.personalBudget,
          totalPaid: p.totalPaid,
          totalOwes: p.totalOwes,
          totalOwed: p.totalOwed,
        })),
      },
      "Wallet fetched",
    ),
  );
});

export const updateWalletSettings = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;
  const { expensePermission, budget } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  /* ---------- AUTHORIZATION ---------- */
  let allowed = trip.createdBy.toString() === userId.toString();

  if (!allowed) {
    const isCaptain = await TripRole.exists({
      trip: tripId,
      assignedTo: userId,
      roleName: "Captain",
      status: "active",
    });
    allowed = !!isCaptain;
  }

  if (!allowed) {
    throw new ApiError(403, "Not authorized to update wallet settings");
  }

  /* ---------- VALIDATION ---------- */
  const updates = {};

  if (expensePermission) {
    if (!["all", "accountant_only"].includes(expensePermission)) {
      throw new ApiError(400, "Invalid expense permission value");
    }
    updates["settings.expensePermission"] = expensePermission;
  }

  if (budget !== undefined) {
    if (budget < 0) {
      throw new ApiError(400, "Budget cannot be negative");
    }
    updates.budget = budget;
  }

  const wallet = await TripWallet.findOneAndUpdate(
    { trip: tripId },
    { $set: updates },
    { new: true },
  ).lean();

  emitToTrip(tripId, EVENTS.WALLET_SETTINGS_UPDATED, {
    tripId,
    settings: wallet.settings,
    budget: wallet.budget,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, wallet, "Wallet settings updated successfully"));
});

export const addExpense = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;

  /* ---------------- TRIP ---------------- */
  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (!isUserTripParticipant({ trip, userId })) {
    throw new ApiError(403, "Not a trip participant");
  }

  /* ---------------- WALLET ---------------- */
  const wallet = await TripWallet.findOne({ trip: tripId });
  if (!wallet) throw new ApiError(404, "Wallet not found");

  const allowed = await canUserAddExpense({ userId, trip, wallet });
  if (!allowed) throw new ApiError(403, "Not allowed to add expense");

  /* ---------------- BASIC VALIDATION ---------------- */
  const { amount, paidBy, splitAmong } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, "Expense amount must be greater than zero");
  }

  if (!Array.isArray(paidBy) || paidBy.length === 0) {
    throw new ApiError(400, "Paid by cannot be empty");
  }

  if (!Array.isArray(splitAmong) || splitAmong.length === 0) {
    throw new ApiError(400, "Split among cannot be empty");
  }

  const sum = (arr) => arr.reduce((a, b) => a + Number(b.amount || 0), 0);

  if (sum(paidBy) !== amount) {
    throw new ApiError(400, "Paid total does not match expense amount");
  }

  if (sum(splitAmong) !== amount) {
    throw new ApiError(400, "Split total does not match expense amount");
  }

  /* ---------------- NORMALIZE LOCATION ---------------- */
  if (req.body.location && typeof req.body.location === "string") {
    req.body.location = { name: req.body.location };
  }

  /* ---------------- SPLIT TYPE ---------------- */
  if (!req.body.splitType) {
    req.body.splitType = "custom";
  }

  /* ---------------- CREATE EXPENSE ---------------- */
  const expense = await Expense.create({
    ...req.body,
    wallet: wallet._id,
    addedBy: userId,
  });

  /* ---------------- UPDATE WALLET PARTICIPANTS (CORRECTED) ---------------- */

  // 1️⃣ Update totalPaid for payers
  expense.paidBy.forEach((p) => {
    const participant = wallet.participants.find(
      (x) => x.user.toString() === p.user.toString(),
    );
    if (participant) {
      participant.totalPaid += p.amount;
    }
  });

  // 2️⃣ Update totalOwes for splitters
  expense.splitAmong.forEach((s) => {
    const participant = wallet.participants.find(
      (x) => x.user.toString() === s.user.toString(),
    );
    if (participant) {
      participant.totalOwes += s.amount;
    }
  });

  // 3️⃣ ✅ NEW: Update totalOwed for payers (money owed TO them)
  expense.paidBy.forEach((payer) => {
    const payerParticipant = wallet.participants.find(
      (x) => x.user.toString() === payer.user.toString(),
    );
    if (!payerParticipant) return;

    // Calculate how much this payer is owed
    expense.splitAmong.forEach((splitter) => {
      // Skip if payer is also the splitter (they don't owe themselves)
      if (payer.user.toString() === splitter.user.toString()) {
        return;
      }

      // Proportional amount owed based on payer's contribution
      const payerProportion = payer.amount / expense.amount;
      const owedAmount = splitter.amount * payerProportion;

      payerParticipant.totalOwed += owedAmount;
    });
  });

  wallet.totalSpend += expense.amount;
  await wallet.save();

  /* ---------------- SOCKET EVENT ---------------- */
  emitToTrip(tripId, EVENTS.WALLET_EXPENSE_ADDED, {
    tripId,
    expense,
  });

  /* ---------------- ACTIVITY ---------------- */
  await TripActivity.create({
    trip: tripId,
    type: "expense_added",
    actor: userId,
    targetId: expense._id,
    targetModel: "Expense",
  });

  return res.status(201).json(new ApiResponse(201, expense, "Expense added"));
});

export const updateExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user._id;

  const expense = await Expense.findById(expenseId);
  if (!expense) throw new ApiError(404, "Expense not found");

  const wallet = await TripWallet.findById(expense.wallet);
  const trip = await Trip.findById(wallet.trip);

  if (trip.status === "completed") {
    throw new ApiError(403, "Trip completed. Wallet locked.");
  }

  const isCreator = trip.createdBy.toString() === userId.toString();
  const isAccountant = await TripRole.exists({
    trip: trip._id,
    assignedTo: userId,
    roleName: "Accountant",
    status: "active",
  });

  if (!isCreator && !isAccountant) {
    throw new ApiError(403, "Not allowed to update expense");
  }

  /* ---------------- REVERSE OLD EXPENSE EFFECTS ---------------- */

  // 1️⃣ Reverse totalPaid
  expense.paidBy.forEach((p) => {
    const participant = wallet.participants.find(
      (x) => x.user.toString() === p.user.toString(),
    );
    if (participant) {
      participant.totalPaid = Math.max(0, participant.totalPaid - p.amount);
    }
  });

  // 2️⃣ Reverse totalOwes
  expense.splitAmong.forEach((s) => {
    const participant = wallet.participants.find(
      (x) => x.user.toString() === s.user.toString(),
    );
    if (participant) {
      participant.totalOwes = Math.max(0, participant.totalOwes - s.amount);
    }
  });

  // 3️⃣ Reverse totalOwed
  expense.paidBy.forEach((payer) => {
    const payerParticipant = wallet.participants.find(
      (x) => x.user.toString() === payer.user.toString(),
    );
    if (!payerParticipant) return;

    expense.splitAmong.forEach((splitter) => {
      if (payer.user.toString() === splitter.user.toString()) {
        return;
      }

      const payerProportion = payer.amount / expense.amount;
      const owedAmount = splitter.amount * payerProportion;

      payerParticipant.totalOwed = Math.max(
        0,
        payerParticipant.totalOwed - owedAmount,
      );
    });
  });

  wallet.totalSpend = Math.max(0, wallet.totalSpend - expense.amount);

  /* ---------------- APPLY NEW EXPENSE DATA ---------------- */
  Object.assign(expense, req.body);
  await expense.save();

  /* ---------------- APPLY NEW EXPENSE EFFECTS ---------------- */

  // 1️⃣ Add new totalPaid
  expense.paidBy.forEach((p) => {
    const participant = wallet.participants.find(
      (x) => x.user.toString() === p.user.toString(),
    );
    if (participant) {
      participant.totalPaid += p.amount;
    }
  });

  // 2️⃣ Add new totalOwes
  expense.splitAmong.forEach((s) => {
    const participant = wallet.participants.find(
      (x) => x.user.toString() === s.user.toString(),
    );
    if (participant) {
      participant.totalOwes += s.amount;
    }
  });

  // 3️⃣ Add new totalOwed
  expense.paidBy.forEach((payer) => {
    const payerParticipant = wallet.participants.find(
      (x) => x.user.toString() === payer.user.toString(),
    );
    if (!payerParticipant) return;

    expense.splitAmong.forEach((splitter) => {
      if (payer.user.toString() === splitter.user.toString()) {
        return;
      }

      const payerProportion = payer.amount / expense.amount;
      const owedAmount = splitter.amount * payerProportion;

      payerParticipant.totalOwed += owedAmount;
    });
  });

  wallet.totalSpend += expense.amount;
  await wallet.save();

  emitToTrip(trip._id, EVENTS.WALLET_EXPENSE_UPDATED, {
    tripId: trip._id,
    expense,
  });

  await TripActivity.create({
    trip: trip._id,
    type: "expense_updated",
    actor: userId,
    targetId: expense._id,
    targetModel: "Expense",
  });

  res.json(new ApiResponse(200, expense, "Expense updated"));
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user._id;

  const expense = await Expense.findById(expenseId);
  if (!expense) throw new ApiError(404, "Expense not found");

  const wallet = await TripWallet.findById(expense.wallet);
  const trip = await Trip.findById(wallet.trip);

  if (trip.status === "completed") {
    throw new ApiError(403, "Trip completed. Wallet locked.");
  }

  const isCreator = trip.createdBy.toString() === userId.toString();
  const isAccountant = await TripRole.exists({
    trip: trip._id,
    assignedTo: userId,
    roleName: "Accountant",
    status: "active",
  });

  if (!isCreator && !isAccountant) {
    throw new ApiError(403, "Not allowed");
  }

  /* ---------------- REVERSE EXPENSE EFFECTS (CORRECTED) ---------------- */

  // 1️⃣ Reverse totalPaid
  expense.paidBy.forEach((p) => {
    const participant = wallet.participants.find(
      (x) => x.user.toString() === p.user.toString(),
    );
    if (participant) {
      participant.totalPaid = Math.max(0, participant.totalPaid - p.amount);
    }
  });

  // 2️⃣ Reverse totalOwes
  expense.splitAmong.forEach((s) => {
    const participant = wallet.participants.find(
      (x) => x.user.toString() === s.user.toString(),
    );
    if (participant) {
      participant.totalOwes = Math.max(0, participant.totalOwes - s.amount);
    }
  });

  // 3️⃣ ✅ NEW: Reverse totalOwed
  expense.paidBy.forEach((payer) => {
    const payerParticipant = wallet.participants.find(
      (x) => x.user.toString() === payer.user.toString(),
    );
    if (!payerParticipant) return;

    expense.splitAmong.forEach((splitter) => {
      if (payer.user.toString() === splitter.user.toString()) {
        return;
      }

      const payerProportion = payer.amount / expense.amount;
      const owedAmount = splitter.amount * payerProportion;

      payerParticipant.totalOwed = Math.max(
        0,
        payerParticipant.totalOwed - owedAmount,
      );
    });
  });

  wallet.totalSpend = Math.max(0, wallet.totalSpend - expense.amount);

  wallet.expenses?.pull(expense._id);

  await expense.deleteOne();
  await wallet.save();

  emitToTrip(trip._id, EVENTS.WALLET_EXPENSE_DELETED, {
    tripId: trip._id,
    expenseId,
  });

  await TripActivity.create({
    trip: trip._id,
    type: "expense_deleted",
    actor: userId,
    targetId: expense._id,
    targetModel: "Expense",
  });

  res.json(new ApiResponse(200, null, "Expense deleted"));
});

export const getWalletExpenses = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { page = 1 } = req.query;

  const wallet = await TripWallet.findOne({ trip: tripId });
  if (!wallet) throw new ApiError(404, "Wallet not found");

  const expenses = await Expense.find({ wallet: wallet._id }).sort({
    expenseDate: -1,
  });

  res.json(new ApiResponse(200, expenses));
});

export const generateSettlements = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId).populate("participants");
  if (!trip || trip.status !== "completed") {
    throw new ApiError(400, "Trip not completed");
  }

  if (trip.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only trip creator can generate settlements");
  }

  if (trip.summary?.settlements?.length > 0) {
    return res.json(new ApiResponse(200, trip.summary.settlements));
  }

  const wallet = await TripWallet.findOne({ trip: tripId }).populate({
    path: "expenses",
    populate: ["paidBy.user", "splitAmong.user"],
  });

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  // ✅ SETTLEMENT ALGORITHM (Already correct - produces minimum transactions)
  const balance = {};

  wallet.expenses.forEach((e) => {
    e.paidBy.forEach((p) => {
      const uid = p.user._id.toString();
      balance[uid] = (balance[uid] || 0) + p.amount;
    });

    e.splitAmong.forEach((s) => {
      const uid = s.user._id.toString();
      balance[uid] = (balance[uid] || 0) - s.amount;
    });
  });

  const debtors = [];
  const creditors = [];

  Object.entries(balance).forEach(([userId, amt]) => {
    if (amt < 0) debtors.push({ user: userId, amt: -amt });
    else if (amt > 0) creditors.push({ user: userId, amt });
  });

  const settlements = [];

  while (debtors.length && creditors.length) {
    const d = debtors[0];
    const c = creditors[0];
    const paid = Math.min(d.amt, c.amt);

    settlements.push({
      from: d.user,
      to: c.user,
      amount: paid,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      payerConfirmed: false,
      receiverConfirmed: false,
      trustEvaluated: false,
    });

    d.amt -= paid;
    c.amt -= paid;

    if (d.amt === 0) debtors.shift();
    if (c.amt === 0) creditors.shift();
  }

  trip.summary = {
    ...(trip.summary || {}),
    totalSpent: wallet.totalSpend,
    settlements,
  };

  await trip.save();

  emitToTrip(tripId, EVENTS.WALLET_SETTLEMENTS_GENERATED, {
    tripId,
    settlements,
  });

  return res.json(new ApiResponse(200, settlements));
});

export const confirmSettlement = asyncHandler(async (req, res) => {
  const { tripId, settlementId, type } = req.params;
  const userId = req.user._id;

  if (!["payer", "receiver"].includes(type)) {
    throw new ApiError(400, "Invalid confirmation type");
  }

  const trip = await Trip.findById(tripId);
  if (!trip || !trip.summary?.settlements?.length) {
    throw new ApiError(404, "No settlements found");
  }

  if (["cancelled"].includes(trip.status)) {
    throw new ApiError(403, "Trip is cancelled");
  }

  const settlement = trip.summary.settlements.find(
    (s) => s._id.toString() === settlementId,
  );

  if (!settlement) throw new ApiError(404, "Settlement not found");

  if (settlement.settledAt) {
    throw new ApiError(400, "Settlement already finalized");
  }

  /* ----------------------------------------------------
     1. CONFIRMATION STEP (IDEMPOTENT)
  ---------------------------------------------------- */
  if (type === "payer") {
    if (settlement.from.toString() !== userId.toString()) {
      throw new ApiError(403, "Only payer can confirm payment");
    }

    if (!settlement.payerConfirmed) {
      settlement.payerConfirmed = true;

      await sendNotification({
        recipient: settlement.to,
        sender: userId,
        type: "settlement_requested",
        message: "marked a settlement payment as done",
        trip: tripId,
        wallet: trip.wallet,
        settlement: settlement._id,
        metadata: {
          step: "payer_confirmed",
          amount: settlement.amount,
        },
      });
    }
  }

  if (type === "receiver") {
    if (settlement.to.toString() !== userId.toString()) {
      throw new ApiError(403, "Only receiver can confirm payment");
    }

    if (!settlement.receiverConfirmed) {
      settlement.receiverConfirmed = true;
    }
  }

  /* ----------------------------------------------------
     2. FINALIZATION (RUNS ONCE)
  ---------------------------------------------------- */
  let finalizedNow = false;

  if (
    settlement.payerConfirmed &&
    settlement.receiverConfirmed &&
    !settlement.settledAt
  ) {
    settlement.settledAt = new Date();
    finalizedNow = true;
  }

  /* ----------------------------------------------------
     3. WALLET UPDATE (ONLY ON FINALIZATION)
  ---------------------------------------------------- */
  if (finalizedNow) {
    const wallet = await TripWallet.findOne({ trip: tripId });
    if (!wallet) throw new ApiError(404, "Wallet not found");

    const payer = wallet.participants.find(
      (p) => p.user.toString() === settlement.from.toString(),
    );
    const receiver = wallet.participants.find(
      (p) => p.user.toString() === settlement.to.toString(),
    );

    if (!payer || !receiver) {
      throw new ApiError(400, "Wallet participants mismatch");
    }

    payer.totalOwes = Math.max(0, payer.totalOwes - settlement.amount);
    receiver.totalOwed = Math.max(0, receiver.totalOwed - settlement.amount);

    await wallet.save();

    await sendNotification({
      recipient: settlement.from,
      sender: userId,
      type: "settlement_completed",
      message: "confirmed your settlement payment",
      trip: tripId,
      wallet: trip.wallet,
      settlement: settlement._id,
      metadata: {
        amount: settlement.amount,
        settledAt: settlement.settledAt,
      },
    });
  }

  /* ----------------------------------------------------
     4. TRUST / XP EVALUATION (ONLY ONCE)
  ---------------------------------------------------- */
  if (finalizedNow && !settlement.trustEvaluated) {
    const onTime = settlement.settledAt <= settlement.dueAt;

    await awardPoints(
      settlement.from,
      onTime ? "settle_payment" : "late_settlement",
      {
        model: "Trip",
        modelId: trip._id,
        actorId: settlement.to,
      },
    );

    settlement.trustEvaluated = true;
  }

  await trip.save();

  /* ----------------------------------------------------
     5. SOCKET EVENT
  ---------------------------------------------------- */
  emitToTrip(tripId, EVENTS.WALLET_SETTLEMENT_CONFIRMED, {
    tripId,
    settlementId,
    settlement,
  });

  return res.json(new ApiResponse(200, settlement));
});

export const assignAccountant = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { userIds = [] } = req.body;
  const requesterId = req.user._id;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, "userIds array is required");
  }

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  /* ---------- AUTHORIZATION ---------- */
  let allowed = trip.createdBy.toString() === requesterId.toString();

  if (!allowed) {
    const isCaptain = await TripRole.exists({
      trip: tripId,
      assignedTo: requesterId,
      roleName: "Captain",
      status: "active",
    });
    allowed = !!isCaptain;
  }

  if (!allowed) {
    throw new ApiError(403, "Not authorized to assign accountant");
  }

  /* ---------- HANDLE BOTH OLD AND NEW FORMAT ---------- */
  const participantIds = trip.participants
    .map((p) => {
      if (p.user) {
        return p.status === "active" ? p.user.toString() : null;
      }
      return p.toString();
    })
    .filter(Boolean);

  const validUserIds = userIds.filter((uid) =>
    participantIds.includes(uid.toString()),
  );

  if (validUserIds.length === 0) {
    throw new ApiError(
      400,
      "Only trip participants can be assigned as accountant",
    );
  }

  /* ---------- PREVENT DUPLICATES ---------- */
  const existing = await TripRole.find({
    trip: tripId,
    roleName: "Accountant",
    assignedTo: { $in: validUserIds },
    status: "active",
  }).select("assignedTo");

  const existingSet = new Set(existing.map((r) => r.assignedTo.toString()));

  const rolesToInsert = validUserIds
    .filter((uid) => !existingSet.has(uid.toString()))
    .map((uid) => ({
      trip: tripId,
      roleName: "Accountant",
      assignedTo: uid,
    }));

  if (!rolesToInsert.length) {
    return res.json(new ApiResponse(200, null, "No new accountants to assign"));
  }

  await TripRole.insertMany(rolesToInsert);

  for (const uid of validUserIds) {
    await sendNotification({
      recipient: uid,
      sender: requesterId,
      type: "system_message",
      message: "assigned you as an accountant for the trip",
      trip: tripId,
      wallet: trip.wallet,
      metadata: {
        role: "Accountant",
        action: "assigned",
      },
    });
  }

  emitToTrip(tripId, EVENTS.WALLET_ACCOUNTANT_ASSIGNED, {
    tripId,
    userIds: validUserIds,
  });

  return res.json(
    new ApiResponse(200, null, "Accountants assigned successfully"),
  );
});

export const removeAccountant = asyncHandler(async (req, res) => {
  const { tripId, userId } = req.params;

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  await TripRole.deleteOne({
    trip: tripId,
    assignedTo: userId,
    roleName: "Accountant",
  });

  emitToTrip(tripId, EVENTS.WALLET_ACCOUNTANT_REMOVED, {
    tripId,
    userId,
  });

  await sendNotification({
    recipient: userId,
    sender: req.user._id,
    type: "system_message",
    message: "removed you as an accountant from the trip",
    trip: tripId,
    wallet: trip.wallet,
    metadata: {
      role: "Accountant",
      action: "removed",
    },
  });

  res.json(new ApiResponse(200, null, "Accountant removed"));
});

export const setPersonalBudget = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;
  const { budget } = req.body;

  if (budget === undefined || budget < 0) {
    throw new ApiError(400, "Invalid budget value");
  }

  const wallet = await TripWallet.findOne({ trip: tripId });
  if (!wallet) throw new ApiError(404, "Wallet not found");

  // 🔥 AUTO-MIGRATION FOR OLD WALLETS
  if (!wallet.participants || wallet.participants.length === 0) {
    const trip = await Trip.findById(tripId).select("participants");
    if (!trip) throw new ApiError(404, "Trip not found");

    wallet.participants = trip.participants.map((uid) => ({
      user: uid,
      personalBudget: 0,
      totalPaid: 0,
      totalOwed: 0,
      totalOwes: 0,
    }));

    await wallet.save();
  }

  const participant = wallet.participants.find(
    (p) => p.user.toString() === userId.toString(),
  );

  if (!participant) {
    throw new ApiError(403, "Not a trip participant");
  }

  participant.personalBudget = budget;
  await wallet.save();

  emitToTrip(tripId, EVENTS.WALLET_PERSONAL_BUDGET_UPDATED, {
    userId,
    budget,
  });

  console.log("budget:", budget);

  return res.json(new ApiResponse(200, { budget }, "Personal budget updated"));
});

export const setTripBudget = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;
  const { budget } = req.body;

  if (budget === undefined || budget < 0) {
    throw new ApiError(400, "Invalid trip budget");
  }

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  let allowed = trip.createdBy.toString() === userId.toString();

  if (!allowed) {
    const isCaptain = await TripRole.exists({
      trip: tripId,
      assignedTo: userId,
      roleName: "Captain",
      status: "active",
    });
    allowed = !!isCaptain;
  }

  if (!allowed) {
    throw new ApiError(403, "Not authorized to set trip budget");
  }

  await TripWallet.findOneAndUpdate(
    { trip: tripId },
    { $set: { budget } },
    { new: true },
  ).lean();

  emitToTrip(tripId, EVENTS.WALLET_TRIP_BUDGET_UPDATED, {
    tripId,
    budget,
  });

  return res.json(new ApiResponse(200, { budget }, "Trip budget updated"));
});
