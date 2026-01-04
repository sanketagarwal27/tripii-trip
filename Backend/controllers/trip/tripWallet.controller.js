// import { Expense } from "../models/expense.model.js";
import { TripActivity } from "../../models/trip/tripActivity.model.js";
import { Trip } from "../../models/trip/trip.model.js";
import { TripWallet } from "../../models/trip/tripWallet.model.js";
import { TripRole } from "../../models/trip/tripRole.model.js";

import asyncHandler from "../../utils/asyncHandler.js";
import { awardPoints } from "../../points/awardPoints.js";
import { Expense } from "../../models/trip/expense.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { emitToTrip } from "../../socket/server.js";
import { EVENTS } from "../../socket/events.js";
import { sendNotification } from "../user/notification.controller.js";

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

export const getTripWallet = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;

  const trip = await Trip.findById(tripId)
    .select("participants wallet status createdBy")
    .lean();

  if (!trip) throw new ApiError(404, "Trip not found");

  const wallet = await TripWallet.findById(trip.wallet).lean();
  if (!wallet) throw new ApiError(404, "Wallet not found");

  const canAddExpenseFlag = await canUserAddExpense({
    userId,
    trip,
    wallet,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      wallet: {
        _id: wallet._id,
        totalSpend: wallet.totalSpend,
        budget: wallet.budget,
        settings: wallet.settings,
      },
      participants: trip.participants,
      permissions: {
        canUserAddExpense: canAddExpenseFlag,
      },
    })
  );
});

export const updateWalletSettings = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;
  const { expensePermission, budget } = req.body;

  const trip = await Trip.findById(tripId).lean();
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
    { new: true }
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

  const trip = await Trip.findById(tripId);

  if (!trip.participants.some((p) => p.toString() === userId.toString())) {
    throw new ApiError(403, "Not a trip participant");
  }

  if (!trip) throw new ApiError(404, "Trip not found");

  const wallet = await TripWallet.findOne({ trip: tripId });
  if (!wallet) throw new ApiError(404, "Wallet not found");

  const allowed = await canUserAddExpense({ userId, trip, wallet });
  if (!allowed) throw new ApiError(403, "Not allowed to add expense");

  if (req.body.amount <= 0) {
    throw new ApiError(400, "Expense amount must be greater than zero");
  }

  const expense = await Expense.create({
    ...req.body,
    wallet: wallet._id,
    addedBy: userId,
  });

  wallet.expenses.push(expense._id);
  wallet.totalSpend += expense.amount;
  await wallet.save();

  emitToTrip(tripId, EVENTS.WALLET_EXPENSE_ADDED, {
    tripId,
    expense,
  });

  await TripActivity.create({
    trip: tripId,
    type: "expense_added",
    actor: userId,
    targetId: expense._id,
    targetModel: "Expense",
  });

  res.status(201).json(new ApiResponse(201, expense, "Expense added"));
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

  wallet.totalSpend = Math.max(0, wallet.totalSpend - expense.amount);

  Object.assign(expense, req.body);
  await expense.save();

  wallet.totalSpend += expense.amount;
  await wallet.save();

  emitToTrip(trip._id, EVENTS.WALLET_EXPENSE_UPDATED, {
    tripId: trip._id,
    expense,
  });

  await TripActivity.create({
    trip: trip._id,
    type: "expense_updated", // or expense_deleted
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

  wallet.totalSpend = Math.max(0, wallet.totalSpend - expense.amount);

  wallet.expenses.pull(expense._id);

  await expense.deleteOne();
  await wallet.save();

  emitToTrip(trip._id, EVENTS.WALLET_EXPENSE_DELETED, {
    tripId: trip._id,
    expenseId,
  });

  await TripActivity.create({
    trip: trip._id,
    type: "expense_deleted", // or expense_deleted
    actor: userId,
    targetId: expense._id,
    targetModel: "Expense",
  });

  res.json(new ApiResponse(200, null, "Expense deleted"));
});

export const getWalletExpenses = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const wallet = await TripWallet.findOne({ trip: tripId });
  if (!wallet) throw new ApiError(404, "Wallet not found");

  const expenses = await Expense.find({ wallet: wallet._id })
    .sort({ expenseDate: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

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

  if (trip.summary?.settlements?.length) {
    return res.json(new ApiResponse(200, trip.summary.settlements));
  }

  const wallet = await TripWallet.findOne({ trip: tripId }).populate({
    path: "expenses",
    populate: ["paidBy.user", "splitAmong.user"],
  });

  const balance = {};

  wallet.expenses.forEach((e) => {
    e.paidBy.forEach((p) => {
      balance[p.user] = (balance[p.user] || 0) + p.amount;
    });
    e.splitAmong.forEach((s) => {
      balance[s.user] = (balance[s.user] || 0) - s.amount;
    });
  });

  const settlements = [];
  const debtors = [];
  const creditors = [];

  Object.entries(balance).forEach(([u, amt]) => {
    if (amt < 0) debtors.push({ u, amt: -amt });
    else if (amt > 0) creditors.push({ u, amt });
  });

  while (debtors.length && creditors.length) {
    const d = debtors[0];
    const c = creditors[0];
    const paid = Math.min(d.amt, c.amt);

    settlements.push({
      from: d.u,
      to: c.u,
      amount: paid,
      dueAt: new Date(Date.now() + 7 * 86400000),
    });

    d.amt -= paid;
    c.amt -= paid;

    if (!d.amt) debtors.shift();
    if (!c.amt) creditors.shift();
  }

  trip.summary = {
    ...trip.summary,
    totalSpent: wallet.totalSpend,
    settlements,
  };

  await trip.save();

  emitToTrip(tripId, EVENTS.WALLET_SETTLEMENTS_GENERATED, {
    tripId,
    settlements,
  });

  res.json(new ApiResponse(200, settlements));
});

export const confirmSettlement = asyncHandler(async (req, res) => {
  const { tripId, index, type } = req.params;
  const userId = req.user._id;

  const trip = await Trip.findById(tripId);
  const settlement = trip.summary.settlements[index];

  if (!settlement) throw new ApiError(404, "Settlement not found");

  if (settlement.settledAt) {
    throw new ApiError(400, "Settlement already finalized");
  }

  if (type === "payer") {
    if (settlement.from.toString() !== userId.toString())
      throw new ApiError(403, "Not payer");
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

  if (type === "receiver") {
    if (settlement.to.toString() !== userId.toString())
      throw new ApiError(403, "Not receiver");
    settlement.receiverConfirmed = true;
  }

  if (settlement.payerConfirmed && settlement.receiverConfirmed) {
    settlement.settledAt = new Date();
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

  if (
    settlement.payerConfirmed &&
    settlement.receiverConfirmed &&
    !settlement.trustEvaluated
  ) {
    const onTime = settlement.settledAt <= settlement.dueAt;

    await awardPoints(
      settlement.from,
      onTime ? "settle_payment" : "late_settlement",
      {
        model: "Trip",
        modelId: trip._id,
        actorId: settlement.to, // the receiver confirming payment
      }
    );

    settlement.trustEvaluated = true;
  }

  await trip.save();

  emitToTrip(tripId, EVENTS.WALLET_SETTLEMENT_CONFIRMED, {
    tripId,
    index,
    settlement,
  });

  res.json(new ApiResponse(200, settlement));
});

export const assignAccountant = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { userIds = [] } = req.body;
  const requesterId = req.user._id;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, "userIds array is required");
  }

  const trip = await Trip.findById(tripId).select("participants createdBy");
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

  /* ---------- FILTER ONLY TRIP PARTICIPANTS ---------- */
  const participantSet = new Set(trip.participants.map((p) => p.toString()));

  const validUserIds = userIds.filter((uid) =>
    participantSet.has(uid.toString())
  );

  if (validUserIds.length === 0) {
    throw new ApiError(
      400,
      "Only trip participants can be assigned as accountant"
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
    new ApiResponse(200, null, "Accountants assigned successfully")
  );
});

export const removeAccountant = asyncHandler(async (req, res) => {
  const { tripId, userId } = req.params;

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
