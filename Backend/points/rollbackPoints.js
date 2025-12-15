// rollbackPointsForModel.js
import { PointsLog } from "../models/user/pointsLog.model.js";
import { User } from "../models/user/user.model.js";
import { recalcLevel } from "./levelEngine.js";

/**
 * Universal rollback function.
 *
 * Supports:
 * 1) rollbackPointsForModel("Post", postId)
 * 2) rollbackPointsForModel("Post", postId, actorId, "post_like_received")
 */
export async function rollbackPointsForModel(
  model,
  modelId,
  actorId = null,
  activity = null
) {
  let query = { model, modelId };

  // Unlike case → rollback only logs related to *this* actor
  if (actorId && activity) {
    query.actorId = actorId;
    query.activity = activity;
  }

  const logs = await PointsLog.find(query);
  if (!logs || logs.length === 0) {
    console.warn("⚠ No logs found for rollback:", query);
    return;
  }

  // Group XP rollback by userId (the user who RECEIVED the XP)
  const grouped = {};

  for (const log of logs) {
    const receiverId = log.userId.toString(); // post author

    if (!grouped[receiverId]) grouped[receiverId] = { xp: 0, trust: 0 };

    grouped[receiverId].xp += log.xp;
    grouped[receiverId].trust += log.trust;
  }

  // Apply rollback
  for (const uid of Object.keys(grouped)) {
    const user = await User.findById(uid);
    if (!user) continue;

    user.xpPoints = Number(
      Math.max(0, user.xpPoints - grouped[uid].xp).toFixed(2)
    );

    user.trustScore = user.xpPoints = Number(
      Math.max(-20, user.trustScore - grouped[uid].trust).toFixed(2)
    );

    // recalc level
    const lvl = recalcLevel(user.xpPoints);
    Object.assign(user, {
      level: lvl.level,
      subLevel: lvl.subLevel,
      levelProgress: lvl.levelProgress,
      nextLevelXP: lvl.nextLevelXP,
    });

    await user.save();
  }

  // Delete ONLY the relevant logs (not all logs blindly)
  await PointsLog.deleteMany(query);
}
