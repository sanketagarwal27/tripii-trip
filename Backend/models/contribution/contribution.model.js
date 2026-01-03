import mongoose, { Schema } from "mongoose";

// --- 1. THE BASE SCHEMA (Common Fields) ---
const placeSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    type: {
      type: String,
      required: true,
      enum: ["Accommodation", "Food & Dining", "Tourist Spot"],
    },
    placeName: { type: String, required: true }, //Name of Hotel/Restaurant/Tourist Spot
    location: { type: String, required: true }, //Bigger Address (State or Country or City)
    address: { type: String, required: true }, //Specific Location (Street Name)
    contactNumber: String, //POC contact
    contactPerson: String, //POC

    // GeoJSON for Safety features later
    coordinates: {
      type: { type: String, default: "Point" },
      coordinates: [Number], // [long, lat]
    },

    dateOfVisit: { type: Date },
    description: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    images: [String], // Array of URLs

    tripId: { type: String }, // To group them by "Paris Trip 2024"
  },
  {
    discriminatorKey: "type", // This tells Mongoose which variant to use
    timestamps: true,
  }
);

// Create the Base Model
const Contribution = mongoose.model("Contribution", placeSchema);

// --- 2. THE VARIANTS (Specific Fields) ---

// Accommodation Schema
const Accommodation = Contribution.discriminator(
  "Accommodation",
  new Schema({
    category: {
      type: String,
      enum: ["Hotel", "Hostel", "Resort", "Homestay"],
    },
    hotelStars: String, // "3 Star"
    hostelVibe: String, // "Social"
    roomsRating: { type: Number, min: 1, max: 5 },
    //Can add room prices later
    hospitalityRating: { type: Number, min: 1, max: 5 },
    amenities: [String],
  })
);

// Dining Schema
const Dining = Contribution.discriminator(
  "Food & Dining",
  new Schema({
    category: {
      type: String,
      enum: ["Restaurant", "Cafe", "Street Food", "Bar"],
    },
    cuisine: [String],
    priceRange: String, // "1", "2", "3"
    dietary: [String], // "Vegan"
    mustTry: String,
    foodRating: { type: Number, min: 1, max: 5 },
    ambienceRating: { type: Number, min: 1, max: 5 },
    serviceRating: { type: Number, min: 1, max: 5 },
  })
);

// Spot Schema
const Spot = Contribution.discriminator(
  "Tourist Spot",
  new Schema({
    category: {
      type: String,
      enum: ["Historical", "Nature", "Gallery", "Activity", "Viewpoint"],
    },
    timeSpent: String,
    isFree: Boolean,
    entryCost: String,
  })
);

export { Contribution, Accommodation, Dining, Spot };
