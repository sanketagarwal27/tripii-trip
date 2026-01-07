import asyncHandler from "../../utils/asyncHandler.js";
import { Contribution } from "../../models/contribution/contribution.model.js";
import { User } from "../../models/user/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import mongoose from "mongoose";
import { POINTS } from "../../points/pointsConfig.js";
import { PointsLog } from "../../models/user/pointsLog.model.js";
import { recalcLevel } from "../../points/levelEngine.js";

export const approveContribution = asyncHandler(async (req, res) => {
  const { contributionId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch Contribution
    const contribution = await Contribution.findById(contributionId).session(
      session
    );
    if (!contribution) {
      throw new ApiError(404, "Contribution not found");
    }

    if (contribution.status === "Approved") {
      throw new ApiError(400, "Contribution is already approved");
    }

    const user = await User.findById(contribution.userId).session(session);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Remove from pending (works even if ID is not there)
    user.pendingContributions.pull(contributionId);

    // Check if we need to award points (Ensure ID isn't already in processed contributions)
    const isAlreadyProcessed = user.contributions.some(
      (id) => id.toString() === contributionId.toString()
    );

    if (!isAlreadyProcessed) {
      // Add to contributions
      user.contributions.push(contributionId);

      // --- POINTS & LEVEL LOGIC ---
      const config = POINTS["verified_contribution"];
      const xpToAdd = config.xp;
      const trustToAdd = config.trust;

      // Update User Stats
      user.xpPoints = Number(((user.xpPoints || 0) + xpToAdd).toFixed(2));
      user.trustScore = Number(
        ((user.trustScore || 0) + trustToAdd).toFixed(2)
      );

      // Recalculate Level
      const lvl = recalcLevel(user.xpPoints);
      user.level = lvl.level;
      user.subLevel = lvl.subLevel;
      user.levelProgress = lvl.levelProgress;
      user.nextLevelXP = lvl.nextLevelXP;

      // Update Contribution Meta
      contribution.points_awarded = xpToAdd;

      // --- CREATE POINTS LOG ---
      await PointsLog.create(
        [
          {
            userId: user._id,
            activity: "verified_contribution",
            xp: xpToAdd,
            trust: trustToAdd,
            model: "Contribution",
            modelId: contribution._id,
            actorId: req.user?._id,
          },
        ],
        { session }
      );
    } else {
      console.warn(
        "⚠️ ID was already in user.contributions, skipping points to avoid double-count."
      );
    }

    contribution.status = "Approved";

    await user.save({ session });
    await contribution.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { contribution, userLevel: user.level, userXP: user.xpPoints },
          "Contribution approved, points awarded, and user level updated!"
        )
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const rejectContribution = asyncHandler(async (req, res) => {
  const { contributionId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const contribution = await Contribution.findById(contributionId).session(
      session
    );
    if (!contribution) throw new ApiError(404, "Contribution not found");

    if (contribution.status === "Rejected") {
      throw new ApiError(400, "Contribution is already rejected");
    }

    const user = await User.findById(contribution.userId).session(session);
    if (!user) throw new ApiError(404, "User not found");

    // --- CASE 1: Reversing an Approval (Deduct Points) ---
    if (contribution.status === "Approved") {
      // 1. Remove from valid contributions
      user.contributions.pull(contributionId);

      // 2. Deduct Points & Trust
      const xpToRemove = contribution.points_awarded || 0;
      // We assume a standard trust reversal or fetch from config.
      // For safety, let's use the config value for verified_contribution.
      const trustToRemove = POINTS["verified_contribution"].trust;

      user.xpPoints = Math.max(
        0,
        Number(((user.xpPoints || 0) - xpToRemove).toFixed(2))
      );
      user.trustScore = Number(
        ((user.trustScore || 0) - trustToRemove).toFixed(2)
      );

      // 3. Recalc Level (User might drop a level)
      const lvl = recalcLevel(user.xpPoints);
      if (lvl) {
        user.level = lvl.level;
        user.subLevel = lvl.subLevel;
        user.levelProgress = lvl.levelProgress;
        user.nextLevelXP = lvl.nextLevelXP;
      }

      // 4. Log the Reversal
      await PointsLog.create(
        [
          {
            userId: user._id,
            activity: "contribution_rejected_after_approval",
            xp: -xpToRemove,
            trust: -trustToRemove,
            model: "Contribution",
            modelId: contribution._id,
            actorId: req.user?._id,
          },
        ],
        { session }
      );

      contribution.points_awarded = 0;
    }
    // --- CASE 2: Standard Rejection (Pending -> Rejected) ---
    else {
      // Just ensure it's removed from pending
      user.pendingContributions.pull(contributionId);
    }

    // Move to Rejected Array
    // Check if already there to avoid duplicates
    if (!user.rejectedContributions.includes(contributionId)) {
      user.rejectedContributions.push(contributionId);
    }

    contribution.status = "Rejected";

    await user.save({ session });
    await contribution.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(200, contribution, "Contribution rejected successfully")
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const setBackToPending = asyncHandler(async (req, res) => {
  const { contributionId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const contribution = await Contribution.findById(contributionId).session(
      session
    );
    if (!contribution) throw new ApiError(404, "Contribution not found");

    if (contribution.status === "Pending") {
      throw new ApiError(400, "Contribution is already pending");
    }

    const user = await User.findById(contribution.userId).session(session);
    if (!user) throw new ApiError(404, "User not found");

    // --- CASE A: Moving from Approved -> Pending (Deduct Points) ---
    if (contribution.status === "Approved") {
      user.contributions.pull(contributionId);

      const xpToRemove = contribution.points_awarded || 0;
      const trustToRemove = POINTS["verified_contribution"].trust;

      user.xpPoints = Math.max(
        0,
        Number(((user.xpPoints || 0) - xpToRemove).toFixed(2))
      );
      user.trustScore = Number(
        ((user.trustScore || 0) - trustToRemove).toFixed(2)
      );

      // Recalculate Level
      const lvl = recalcLevel(user.xpPoints);
      if (lvl) {
        user.level = lvl.level;
        user.subLevel = lvl.subLevel;
        user.levelProgress = lvl.levelProgress;
        user.nextLevelXP = lvl.nextLevelXP;
      }

      // Log Reversal
      await PointsLog.create(
        [
          {
            userId: user._id,
            activity: "reverted_to_pending",
            xp: -xpToRemove,
            trust: -trustToRemove,
            model: "Contribution",
            modelId: contribution._id,
            actorId: req.user?._id,
          },
        ],
        { session }
      );

      contribution.points_awarded = 0;
    }
    // --- CASE B: Moving from Rejected -> Pending ---
    else if (contribution.status === "Rejected") {
      user.rejectedContributions.pull(contributionId);
    }

    // Add back to Pending
    if (!user.pendingContributions.includes(contributionId)) {
      user.pendingContributions.push(contributionId);
    }

    contribution.status = "Pending";

    await user.save({ session });
    await contribution.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(200, contribution, "Contribution set back to Pending")
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const getContributions = asyncHandler(async (req, res) => {
  const contributions = await Contribution.find()
    .sort({ createdAt: -1 })
    .populate("userId", "username");

  return res
    .status(200)
    .json(
      new ApiResponse(200, contributions, "Contributions fetched successfully")
    );
});
