import mongoose, { Schema } from "mongoose";

const tripWalletSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      unique: true,
    },

    manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        personalBudget: {
          type: Number,
          default: 0, // user-defined
        },

        totalPaid: {
          type: Number,
          default: 0,
        },

        totalOwed: {
          type: Number,
          default: 0,
        },

        totalOwes: {
          type: Number,
          default: 0,
        },
      },
    ],

    totalSpend: { type: Number, default: 0 },

    budget: { type: Number, default: 0 }, // group budget (optional)

    settings: {
      expensePermission: {
        type: String,
        enum: ["all", "accountant_only"],
        default: "all",
      },
    },
  },
  { timestamps: true }
);

tripWalletSchema.index({ trip: 1 });

export const TripWallet = mongoose.model("TripWallet", tripWalletSchema);
