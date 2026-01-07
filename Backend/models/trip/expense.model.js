import mongoose, { Schema } from "mongoose";

const expenseSchema = new Schema(
  {
    wallet: { type: Schema.Types.ObjectId, ref: "TripWallet", required: true },

    description: { type: String, trim: true },

    amount: { type: Number, required: true },

    location: {
      name: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    paidBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
      },
    ],

    splitAmong: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
      },
    ],

    splitType: {
      type: String,
      enum: ["equal", "custom"],
      default: "equal",
    },

    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    category: {
      type: String,
      enum: ["food", "travel", "stay", "shopping", "other"],
      default: "other",
    },

    notes: String,
    receiptImage: String,

    expenseDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
expenseSchema.index({ wallet: 1, expenseDate: -1 });
expenseSchema.index({ "paidBy.user": 1 });
expenseSchema.index({ "splitAmong.user": 1 });

export const Expense = mongoose.model("Expense", expenseSchema);
