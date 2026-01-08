import mongoose, { Schema } from "mongoose";

const placeSummarySchema = new Schema(
  {
    place: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    mode: {
      type: String,
      enum: ["exploratory", "verified"],
      default: "exploratory",
    },

    sources: {
      placeSignals: {
        importance: Number,
        category: String,
      },

      internalReviews: Number,

      aiProvider: {
        type: String,
        default: "mock",
      },
    },

    summary: {
      overallSentiment: String,
      peopleLove: [String],
      peopleDislike: [String],
      bestFor: [String],
      avoidIf: [String],
      foodConsensus: [String],
      hiddenGems: [String],
      touristTraps: [String],
      safetyNotes: [String],
    },

    confidenceScore: {
      type: Number,
      default: 0.3,
    },

    confidenceLabel: {
      type: String,
      enum: ["Exploratory", "Medium", "High"],
      default: "Exploratory",
    },

    lastGeneratedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const PlaceSummary = mongoose.model("PlaceSummary", placeSummarySchema);
