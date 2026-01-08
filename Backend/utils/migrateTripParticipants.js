// utils/migrateTripParticipants.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

import { Trip } from "../models/trip/trip.model.js";

async function migrateTripParticipants() {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MongoDB URI not found in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    const trips = await Trip.find({});
    console.log(`Found ${trips.length} trips to check\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const trip of trips) {
      try {
        console.log(`\n🔍 Checking trip: ${trip._id} - "${trip.title}"`);
        console.log(
          `   Raw participants:`,
          JSON.stringify(
            trip.participants.map((p) => ({
              hasUser: !!p.user,
              hasBuffer: !!p.buffer,
              status: p.status,
            }))
          )
        );

        // Check if ANY participant has buffer or missing user field
        const needsMigration = trip.participants.some((p) => {
          return !p.user || p.buffer;
        });

        if (needsMigration) {
          console.log(`🔄 Migrating trip: ${trip._id}`);

          const newParticipants = trip.participants
            .map((p, idx) => {
              // If already has proper user field, keep it
              if (p.user && !p.buffer) {
                console.log(`   ✓ Participant ${idx} already correct`);
                return {
                  user: p.user,
                  joinedAt: p.joinedAt || trip.createdAt || new Date(),
                  joinedVia: p.joinedVia || "invite",
                  status: p.status || "active",
                  canRejoin: p.canRejoin !== undefined ? p.canRejoin : true,
                };
              }

              // Extract ObjectId from buffer
              let userId;
              if (p.buffer?.data && Array.isArray(p.buffer.data)) {
                const buf = Buffer.from(p.buffer.data);
                userId = new mongoose.Types.ObjectId(buf);
                console.log(`   → Converting buffer to ObjectId: ${userId}`);
              } else if (p._id) {
                userId = p._id;
                console.log(`   → Using _id: ${userId}`);
              } else if (p instanceof mongoose.Types.ObjectId) {
                userId = p;
                console.log(`   → Using direct ObjectId: ${userId}`);
              } else {
                console.error(
                  `   ❌ Cannot extract userId from participant ${idx}`
                );
                return null;
              }

              return {
                user: userId,
                joinedAt: p.joinedAt || trip.createdAt || new Date(),
                joinedVia: p.joinedVia || "invite",
                status: p.status || "active",
                canRejoin: p.canRejoin !== undefined ? p.canRejoin : true,
              };
            })
            .filter(Boolean);

          // Update with proper structure
          await Trip.updateOne(
            { _id: trip._id },
            { $set: { participants: newParticipants } }
          );

          migrated++;
          console.log(
            `   ✅ Successfully migrated ${newParticipants.length} participants`
          );
        } else {
          skipped++;
          console.log(`   ⏭️  Already in correct format`);
        }
      } catch (err) {
        errors++;
        console.error(`❌ Error migrating trip ${trip._id}:`, err.message);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`⏭️  Skipped (already correct): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📝 Total trips processed: ${trips.length}`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

migrateTripParticipants();
