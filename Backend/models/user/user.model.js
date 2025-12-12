import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    /* ============================================================
       BASIC USER INFO
    ============================================================ */
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true, // allows users without email
      trim: true,
    },

    password: {
      type: String,
      required: function () {
        // Required only if no social ID exists
        return !this.googleId && !this.facebookId && !this.instagramId;
      },
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    isTestAccount: {
      type: Boolean,
      default: false,
    },

    /* ============================================================
       SOCIAL LOGINS
    ============================================================ */
    googleId: { type: String, index: true, sparse: true },
    facebookId: { type: String, index: true, sparse: true },
    instagramId: { type: String, index: true, sparse: true },

    authProviders: [
      {
        provider: {
          type: String,
          enum: ["email", "google", "facebook", "instagram"],
          required: true,
        },
        providerId: { type: String },
        linkedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    refreshToken: { type: String },

    deviceTokens: [String],

    /* ============================================================
       ACCOUNT & ACTIVITY
    ============================================================ */
    accountStatus: {
      type: String,
      enum: ["active", "disabled", "banned"],
      default: "active",
    },

    lastActive: {
      type: Date,
      default: Date.now,
    },

    loginHistory: [
      {
        ip: String,
        userAgent: String,
        time: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    profilePicture: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    aiChatHistory: [
      {
        id: {type: Number, default: Date.now()},
        text: {type: String, default: "Error occurred" },
        sender: {type: String, enum: ["user", "ai","Error occurred"], default: "Error occurred"},
      }
    ],

    bio: { type: String, default: "" },

    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],

    entity: {
      type: String,
      enum: ["User", "Agency"],
      default: "User",
    },

    privacy: {
      type: Boolean,
      default: false,
    },

    /* ============================================================
       CONTENT RELATIONS
    ============================================================ */
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "Likes" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comments" }],
    bookmarks: [{ type: Schema.Types.ObjectId, ref: "Post" }],

    reels: [{ type: Schema.Types.ObjectId, ref: "Reels" }],
    communities: [{ type: Schema.Types.ObjectId, ref: "Community" }],
    trips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
    rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],

    notifications: [{ type: Schema.Types.ObjectId, ref: "Notification" }],

    /* ============================================================
       POINTS • LEVELS • TRUST
    ============================================================ */
    xpPoints: { type: Number, default: 0 },
    trustScore: { type: Number, default: 0 },

    level: { type: Number, default: 1 }, // Main level (1–∞)
    subLevel: { type: Number, default: 0 }, // Sub-level 0–9
    levelProgress: { type: Number, default: 0 }, // XP in current sublevel
    nextLevelXP: { type: Number, default: 100 }, // auto-updated

    /* ============================================================
       POINTS HISTORY (to prevent spam)
    ============================================================ */
    pointsHistory: [
      {
        activity: String,
        model: String, // Post, Reel, Comment, etc.
        modelId: String,
        points: Number,
        createdAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    /* ============================================================
       CONTRIBUTIONS (verified + pending)
    ============================================================ */
    contributions: [{ type: Schema.Types.ObjectId, ref: "Contribution" }],
    pendingContributions: [
      { type: Schema.Types.ObjectId, ref: "Contribution" },
    ],

    /* ============================================================
       MILESTONES
    ============================================================ */
    milestones: [
      {
        type: {
          type: String,
          enum: [
            "level_up",
            "level_down",
            "first_post",
            "first_trip",
            "first_contribution",
            "100_likes_post",
            "1000_likes_post",
          ],
        },
        achievedAt: { type: Date, default: Date.now },
        metadata: Schema.Types.Mixed,
        _id: false,
      },
    ],

    /* ============================================================
       PAYMENT + TRUST
    ============================================================ */
    prevSettelment: [{ type: Schema.Types.ObjectId, ref: "Settelment" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ============================================================
   PASSWORD HASHING
============================================================ */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* ============================================================
   PASSWORD CHECKER
============================================================ */
userSchema.methods.isPasswordcorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

/* ============================================================
   JWT TOKENS
============================================================ */
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = mongoose.model("User", userSchema);
