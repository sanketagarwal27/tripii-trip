import { POINTS } from "./pointsConfig.js";
import { recalcLevel } from "./levelEngine.js";
import { User } from "../models/user/user.model.js";
import { PointsLog } from "../models/user/pointsLog.model.js";

export async function awardPoints(userId, activity, meta = {}) {
  const config = POINTS[activity];
  if (!config) {
    console.warn(`⚠️ No points config found for activity: ${activity}`);
    return null;
  }

  let xp = config.xp;
  let trust = config.trust;

  // Custom XP override (for diminishing rewards)
  if (meta.forceXP !== undefined) {
    xp = meta.forceXP;
  }

  console.log(`🎁 Awarding points:
    User: ${userId}
    Activity: ${activity}
    XP: ${xp}
    Trust: ${trust}
    Meta: ${JSON.stringify(meta)}`);

  const user = await User.findById(userId);
  if (!user) {
    console.warn(`⚠️ User ${userId} not found`);
    return null;
  }

  const beforeXP = user.xpPoints;
  const beforeTrust = user.trustScore;

  // Award points
  user.xpPoints = Number((user.xpPoints + xp).toFixed(2));
  user.trustScore = Number((user.trustScore + trust).toFixed(2));

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
    activity,
    xp,
    trust,
    model: meta.model,
    modelId: meta.modelId ? meta.modelId.toString() : undefined, // 🔥 Ensure string
    actorId: meta.actorId ? meta.actorId.toString() : undefined, // 🔥 Ensure string
  });

  console.log(`✅ Points awarded successfully:
    XP: ${beforeXP} → ${user.xpPoints} (+${xp})
    Trust: ${beforeTrust} → ${user.trustScore} (+${trust})
    Level: ${user.level}.${user.subLevel}
    Log ID: ${log._id}`);

  return { xp, trust, log };
}

/**
 * 🔥 NEW: Check if points were already awarded for this exact action
 * Use this to prevent double-awarding
 */
export async function hasPointsBeenAwarded(userId, activity, modelId, actorId) {
  const existing = await PointsLog.findOne({
    userId: userId.toString(),
    activity,
    modelId: modelId.toString(),
    actorId: actorId ? actorId.toString() : undefined,
  });

  return !!existing;
}

/**
 * 🔥 NEW: Award points only if not already awarded (idempotent)
 */
export async function awardPointsOnce(userId, activity, meta = {}) {
  if (meta.modelId && meta.actorId) {
    const alreadyAwarded = await hasPointsBeenAwarded(
      userId,
      activity,
      meta.modelId,
      meta.actorId
    );

    if (alreadyAwarded) {
      console.log(`⏭️ Points already awarded for ${activity} - skipping`);
      return null;
    }
  }

  return awardPoints(userId, activity, meta);
}
