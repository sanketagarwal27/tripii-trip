import mongoose, { Schema } from "mongoose";

const tripSchema = new Schema(
  {
    // BASIC
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ["national", "international"], required: true },

    coverPhoto: {
      url: String,
      publicId: String,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isClosed: { type: Boolean, default: false },
    closedAt: Date,

    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },

        joinedVia: {
          type: String,
          enum: ["invite", "room", "link"],
          default: "invite",
        },

        status: {
          type: String,
          enum: ["active", "left", "removed"],
          default: "active",
        },

        leftAt: Date,
        removedAt: Date,

        removedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        canRejoin: {
          type: Boolean,
          default: true,
        },

        _id: false,
      },
    ],

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    location: {
      name: String,
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: [Number], // [lng, lat]
      },
      address: String,
      country: String,
      state: String,
      city: String,
    },

    // 🔥 VISIBILITY ENGINE
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    visibleInCommunities: [{ type: Schema.Types.ObjectId, ref: "Community" }],
    roomsReleted: [{ type: Schema.Types.ObjectId, ref: "Room" }],

    createdByType: {
      type: String,
      enum: ["user", "agency"],
      default: "user",
    },

    region: {
      country: String,
      state: String,
      city: String,
      geoTag: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: [Number],
      },
    },

    // 🔥 GLOBAL BOOST FOR AGENCY TRIPS
    promotion: {
      isBoosted: { type: Boolean, default: false },
      boostedAt: Date,
      boostedUntil: Date,
    },

    fameScore: { type: Number, default: 0 },

    // STATUS
    status: {
      type: String,
      enum: ["planning", "ongoing", "completed", "cancelled"],
      default: "planning",
    },

    // PLANS & CHECKLISTS
    plans: [{ type: Schema.Types.ObjectId, ref: "TripPlan" }],
    checklist: [{ type: Schema.Types.ObjectId, ref: "TripChecklist" }],
    wallet: { type: Schema.Types.ObjectId, ref: "TripWallet" },
    roles: [{ type: Schema.Types.ObjectId, ref: "TripRole" }],
    activityHistory: [{ type: Schema.Types.ObjectId, ref: "TripActivity" }],

    // SUNDAY AI
    sundayAi: {
      lastGenerated: Date,
      totalPlans: Number,
      preferences: {
        budget: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        pace: {
          type: String,
          enum: ["relaxed", "moderate", "packed"],
          default: "moderate",
        },
        interests: [String],
        avoidances: [String],
      },
    },

    // SUMMARY (AFTER TRIP)
    summary: {
      rating: Number,
      feedback: String,
      totalSpent: Number,
      perPersonSpent: Number,
      settlements: [
        {
          from: { type: Schema.Types.ObjectId, ref: "User", required: true },
          to: { type: Schema.Types.ObjectId, ref: "User", required: true },
          amount: { type: Number, required: true },

          payerConfirmed: { type: Boolean, default: false }, // A paid
          receiverConfirmed: { type: Boolean, default: false }, // B received

          dueAt: { type: Date, required: true }, // completedAt + 7 days
          settledAt: Date,

          trustEvaluated: { type: Boolean, default: false },

          _id: false,
        },
      ],
    },

    // SETTINGS
    settings: {
      allowMemberInvites: { type: Boolean, default: true },
      allowChecklistEdit: { type: Boolean, default: true },
      privacyLevel: {
        type: String,
        enum: ["participants", "public"],
        default: "participants",
      },
    },
  },
  { timestamps: true }
);

// VIRTUALS
tripSchema.virtual("duration").get(function () {
  if (!this.startDate || !this.endDate) return 0;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

tripSchema.index({ visibility: 1 });
tripSchema.index({ region: 1 });
tripSchema.index({ visibleInCommunities: 1 });
tripSchema.index({ createdByType: 1 });
tripSchema.index({ promotion: 1 });
tripSchema.index({ fameScore: -1 });

export const Trip = mongoose.model("Trip", tripSchema);
