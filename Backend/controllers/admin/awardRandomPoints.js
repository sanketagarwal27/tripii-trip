import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user/user.model.js";
import { recalcLevel } from "../../points/levelEngine.js";
import { PointsLog } from "../../models/user/pointsLog.model.js";

export const searchUsers = asyncHandler(async (req, res) => {
  const query = req.query.q;
  if (!query) {
    throw new ApiError(400, "Query parameter missing !");
  }
  const keyword = new RegExp(query, "i");

  const users = await User.find({
    $or: [
      { username: { $regex: keyword } },
      { fullName: { $regex: keyword } },
      { email: { $regex: keyword } },
    ],
  })
    .select(
      "_id username fullName email xpPoints trustScore level sublevel levelProgress nextLevelXP profilePicture createdAt accountStatus role"
    )
    .limit(10);

  const formattedUsers = users.map((user) => ({
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    currentXp: user.xpPoints || 0,
    currentTrust: user.trustScore || 0,
    avatar: user.profilePicture || "",
    createdAt: user.createdAt,
    accountStatus: user.accountStatus,
    role: user.role,
  }));
  return res
    .status(200)
    .json(new ApiResponse(200, formattedUsers, "Users Fetched Successfully !"));
});

export const awardRandomPoints = asyncHandler(async (req, res) => {
  const { userId, xpPoints, trustScore } = req.body;
  if (!userId) throw new ApiError(400, "User ID is required !");

  console.log(`🎁 Awarding points:
        User: ${userId}
        Activity: "random_award"
        XP: ${xpPoints}
        Trust: ${trustScore}`);

  const user = await User.findById(userId);
  if (!user) {
    console.warn(`⚠️ User ${userId} not found`);
    return null;
  }

  const beforeXP = user.xpPoints;
  const beforeTrust = user.trustScore;

  // Award points
  user.xpPoints = Number((user.xpPoints + xpPoints).toFixed(2));
  user.trustScore = Number((user.trustScore + trustScore).toFixed(2));

  // Recalculate level
  const lvl = recalcLevel(user.xpPoints);
  user.level = lvl.level;
  user.subLevel = lvl.subLevel;
  user.levelProgress = lvl.levelProgress;
  user.nextLevelXP = lvl.nextLevelXP;

  await user.save();

  // Create log entry
  const log = await PointsLog.create({
    userId,
    activity: "random_award",
    xp: xpPoints,
    trust: trustScore,
    model: "User",
    modelId: userId, // 🔥 Ensure string
    actorId: null, // 🔥 Ensure string
  });

  console.log(`✅ Points awarded successfully:
        XP: ${beforeXP} → ${user.xpPoints} (+${xpPoints})
        Trust: ${beforeTrust} → ${user.trustScore} (+${trustScore})
        Level: ${user.level}.${user.subLevel}
        Log ID: ${log._id}`);

  return res
    .status(200)
    .json(new ApiResponse(200, { user, log }, "Points awarded successfully !"));
});
