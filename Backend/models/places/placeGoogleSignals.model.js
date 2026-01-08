// // Backend/models/places/placeGoogleSignals.model.js
// import mongoose, { Schema } from "mongoose";

// const placeGoogleSignalsSchema = new Schema(
//   {
//     place: {
//       type: String,
//       required: true,
//       unique: true,
//       index: true,
//     },

//     googlePlaceId: String,

//     rating: Number,
//     ratingCount: Number,

//     ratingHistogram: {
//       1: Number,
//       2: Number,
//       3: Number,
//       4: Number,
//       5: Number,
//     },

//     location: {
//       lat: Number,
//       lng: Number,
//     },

//     viewport: {
//       north: Number,
//       south: Number,
//       east: Number,
//       west: Number,
//     },

//     lastFetchedAt: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   { timestamps: true }
// );

// export const PlaceGoogleSignals = mongoose.model(
//   "PlaceGoogleSignals",
//   placeGoogleSignalsSchema
// );
