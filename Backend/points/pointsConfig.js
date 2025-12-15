export const POINTS = {
  // --------------------------
  // POST & FEED SYSTEM
  // --------------------------
  post_created: { xp: 20, trust: 2 },

  // likes → awarded to post owner
  post_like_received: { xp: 3, trust: 1 },
  message_helpful_received: { xp: 0.5, trust: 1 },
  comment_helpful_received: { xp: 0.5, trust: 1 },
  // comments → THIS VALUE IS NOT USED DIRECTLY
  // diminishing reward overrides XP using forceXP
  post_comment_received: { xp: 0, trust: 0 },

  // commenter should NOT earn XP
  comment_created: { xp: 0, trust: 0 },

  // no XP for comment likes (commenter shouldn't earn)
  comment_like_received: { xp: 0, trust: 0 },

  // --------------------------
  // REELS
  // you didn't define special rules here yet, so keep as-is
  // --------------------------
  reel_created: { xp: 25, trust: 2 },
  reel_like_received: { xp: 3, trust: 1 },

  // You likely want diminishing for reel comments too,
  // but since you did NOT specify it, we set it to 0 for now
  reel_comment_received: { xp: 0, trust: 0 },

  // --------------------------
  // COMMUNITY POSTS
  // If you don't want spam, reduce or remove comment XP
  // --------------------------
  community_post_created: { xp: 15, trust: 2 },
  community_comment_received: { xp: 0, trust: 0 },

  // --------------------------
  // TRIP + WALLET SYSTEM
  // --------------------------
  trip_completed: { xp: 80, trust: 10 },
  settle_payment: { xp: 10, trust: 3 },

  // --------------------------
  // SPECIAL EVENTS
  // --------------------------
  verified_contribution: { xp: 100, trust: 20 },
  booking_done: { xp: 50, trust: 5 },
};
