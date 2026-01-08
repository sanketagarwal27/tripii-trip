// utils/checkParticipants.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

import { Trip } from "../models/trip/trip.model.js";
import { User } from "../models/user/user.model.js";

async function checkParticipants() {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    // Check the specific trip from your error
    const tripId = "695a78be2f980636fd013840";
    const userId = "6936689c51c3ad9d6438f34a";

    console.log("🔍 Checking Trip:", tripId);
    console.log("👤 User ID:", userId);
    console.log("=".repeat(60));

    const trip = await Trip.findById(tripId).lean();

    if (!trip) {
      console.log("❌ Trip not found!");
      return;
    }

    console.log("\n📋 Trip Info:");
    console.log("   Title:", trip.title);
    console.log("   Creator:", trip.createdBy);
    console.log(
      "   Participants array length:",
      trip.participants?.length || 0
    );

    console.log("\n📦 Raw Participants Data:");
    console.log(JSON.stringify(trip.participants, null, 2));

    // Check if participants array is empty
    if (!trip.participants || trip.participants.length === 0) {
      console.log("\n⚠️  PROBLEM FOUND: Participants array is EMPTY!");
      console.log("\n🔧 Let's try to recover participants...");

      // Check User collection
      const users = await User.find({ trips: trip._id })
        .select("_id username")
        .lean();

      console.log(
        `\n📊 Found ${users.length} users with this trip in their 'trips' array:`
      );
      users.forEach((u) => {
        const isTarget = u._id.toString() === userId;
        console.log(
          `   ${isTarget ? "👉" : "  "} ${u._id} - ${u.username} ${
            isTarget ? "(THIS USER)" : ""
          }`
        );
      });

      if (users.length > 0) {
        console.log("\n✅ We can recover participants from User collection!");
        console.log("   Run the emergency migration to fix this.");
      } else {
        console.log("\n⚠️  No users found with this trip. This is unusual.");
      }
    } else {
      // Check format
      console.log("\n🔍 Checking participant format...");

      trip.participants.forEach((p, idx) => {
        const hasUser = !!p.user;
        const hasStatus = !!p.status;
        const isActive = p.status === "active";
        const userId_participant = p.user?.toString() || p.toString();
        const isTargetUser = userId_participant === userId;

        console.log(`\n   [${idx}] ${isTargetUser ? "👉 TARGET USER" : ""}`);
        console.log(`      Has 'user' field: ${hasUser}`);
        console.log(`      User ID: ${userId_participant}`);
        console.log(`      Status: ${p.status || "MISSING"}`);
        console.log(`      Is Active: ${isActive}`);
        console.log(`      Format: ${hasUser ? "✅ NEW" : "❌ OLD"}`);
      });

      // Check if target user is in participants
      const userIsParticipant = trip.participants.some((p) => {
        const pid = p.user?.toString() || p.toString();
        return pid === userId && (!p.status || p.status === "active");
      });

      console.log("\n📊 Result:");
      console.log(
        `   Target user IS participant: ${
          userIsParticipant ? "✅ YES" : "❌ NO"
        }`
      );

      if (!userIsParticipant) {
        console.log("\n⚠️  PROBLEM: User is not in participants array!");
        console.log("   Check if user has this trip in their 'trips' array:");

        const user = await User.findById(userId)
          .select("trips username")
          .lean();
        if (user) {
          const hasTrip = user.trips?.some((t) => t.toString() === tripId);
          console.log(
            `   User '${user.username}' has trip in trips array: ${
              hasTrip ? "✅ YES" : "❌ NO"
            }`
          );

          if (hasTrip) {
            console.log(
              "\n💡 Solution: User has trip in their array but not in trip.participants"
            );
            console.log("   Run emergency migration to sync.");
          }
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Check complete");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkParticipants();
