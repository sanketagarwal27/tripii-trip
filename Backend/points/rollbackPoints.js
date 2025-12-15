// rollbackPointsForModel.js
import { PointsLog } from "../models/user/pointsLog.model.js";
import { User } from "../models/user/user.model.js";
import { recalcLevel } from "./levelEngine.js";

/**
 * Universal rollback function.
 *
 * Supports:
 * 1) rollbackPointsForModel("Post", postId) - rollback ALL points related to this post
 * 2) rollbackPointsForModel("Post", postId, actorId, "post_like_received") - rollback specific action
 */
export async function rollbackPointsForModel(
  model,
  modelId,
  actorId = null,
  activity = null
) {
  // Build query
  let query = { model, modelId: modelId.toString() }; // 🔥 Ensure modelId is string

  // If actorId and activity provided, only rollback that specific action
  if (actorId && activity) {
    query.actorId = actorId.toString();
    query.activity = activity;
  }

  console.log("🔍 Rollback query:", JSON.stringify(query, null, 2));

  const logs = await PointsLog.find(query);

  if (!logs || logs.length === 0) {
    console.warn("⚠ No logs found for rollback:", query);
    return;
  }

  console.log(`📋 Found ${logs.length} logs to rollback`);

  // Group XP/trust by userId (the user who RECEIVED the points)
  const grouped = {};

  for (const log of logs) {
    const receiverId = log.userId.toString();

    if (!grouped[receiverId]) {
      grouped[receiverId] = { xp: 0, trust: 0, logs: [] };
    }

    grouped[receiverId].xp += log.xp;
    grouped[receiverId].trust += log.trust;
    grouped[receiverId].logs.push(log._id);

    console.log(
      `  - User ${receiverId}: -${log.xp} XP, -${log.trust} trust (${log.activity})`
    );
  }

  // Apply rollback to each affected user
  for (const uid of Object.keys(grouped)) {
    const user = await User.findById(uid);
    if (!user) {
      console.warn(`⚠ User ${uid} not found, skipping rollback`);
      continue;
    }

    const beforeXP = user.xpPoints;
    const beforeTrust = user.trustScore;

    // 🔥 FIX: Separate calculations for xpPoints and trustScore
    user.xpPoints = Number(
      Math.max(0, user.xpPoints - grouped[uid].xp).toFixed(2)
    );

    user.trustScore = Number(
      Math.max(-20, user.trustScore - grouped[uid].trust).toFixed(2)
    );

    // Recalculate level based on NEW xpPoints
    const lvl = recalcLevel(user.xpPoints);
    user.level = lvl.level;
    user.subLevel = lvl.subLevel;
    user.levelProgress = lvl.levelProgress;
    user.nextLevelXP = lvl.nextLevelXP;

    await user.save();

    console.log(`✅ User ${uid} rollback:
      XP: ${beforeXP} → ${user.xpPoints} (-${grouped[uid].xp})
      Trust: ${beforeTrust} → ${user.trustScore} (-${grouped[uid].trust})
      Level: ${lvl.level}.${lvl.subLevel}`);
  }

  // 🔥 Delete ONLY the logs we rolled back
  const logIds = Object.values(grouped).flatMap((g) => g.logs);
  await PointsLog.deleteMany({ _id: { $in: logIds } });

  console.log(`🗑️ Deleted ${logIds.length} point logs`);
}

/**
 * 🔥 NEW: Rollback a SPECIFIC log entry
 * Use this when you know the exact log to rollback (more precise)
 */
export async function rollbackSpecificLog(logId) {
  const log = await PointsLog.findById(logId);
  if (!log) {
    console.warn("⚠ Log not found:", logId);
    return;
  }

  const user = await User.findById(log.userId);
  if (!user) {
    console.warn("⚠ User not found:", log.userId);
    return;
  }

  const beforeXP = user.xpPoints;
  const beforeTrust = user.trustScore;

  user.xpPoints = Number(Math.max(0, user.xpPoints - log.xp).toFixed(2));
  user.trustScore = Number(
    Math.max(-20, user.trustScore - log.trust).toFixed(2)
  );

  const lvl = recalcLevel(user.xpPoints);
  user.level = lvl.level;
  user.subLevel = lvl.subLevel;
  user.levelProgress = lvl.levelProgress;
  user.nextLevelXP = lvl.nextLevelXP;

  await user.save();
  await PointsLog.findByIdAndDelete(logId);

  console.log(`✅ Rollback log ${logId}:
    User: ${log.userId}
    Activity: ${log.activity}
    XP: ${beforeXP} → ${user.xpPoints} (-${log.xp})
    Trust: ${beforeTrust} → ${user.trustScore} (-${log.trust})`);
}
