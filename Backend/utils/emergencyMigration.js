// utils/emergencyMigration.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

import { Trip } from "../models/trip/trip.model.js";
import { User } from "../models/user/user.model.js";

async function emergencyMigration() {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    const trips = await Trip.find({}).lean();
    console.log(`Found ${trips.length} trips to process\n`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const trip of trips) {
      try {
        console.log(`\n🔍 Trip: ${trip._id} - "${trip.title}"`);

        // Check if participants is empty or wrong format
        if (!trip.participants || trip.participants.length === 0) {
          console.log("   ⚠️  Empty participants array - RECOVERING...");

          // Recover from User collection
          const users = await User.find({ trips: trip._id })
            .select("_id")
            .lean();

          if (users.length > 0) {
            console.log(`   📦 Found ${users.length} users to add`);

            const newParticipants = users.map((u) => ({
              user: u._id,
              joinedAt: trip.createdAt || new Date(),
              joinedVia: "invite",
              status: "active",
              canRejoin: true,
            }));

            // Ensure creator is included
            const hasCreator = newParticipants.some(
              (p) => p.user.toString() === trip.createdBy.toString()
            );

            if (!hasCreator) {
              console.log("   ➕ Adding creator to participants");
              newParticipants.unshift({
                user: trip.createdBy,
                joinedAt: trip.createdAt || new Date(),
                joinedVia: "invite",
                status: "active",
                canRejoin: true,
              });
            }

            await Trip.updateOne(
              { _id: trip._id },
              { $set: { participants: newParticipants } }
            );

            console.log(
              `   ✅ FIXED - Added ${newParticipants.length} participants`
            );
            fixed++;
          } else {
            console.log("   ⚠️  No users found, adding creator only");

            await Trip.updateOne(
              { _id: trip._id },
              {
                $set: {
                  participants: [
                    {
                      user: trip.createdBy,
                      joinedAt: trip.createdAt || new Date(),
                      joinedVia: "invite",
                      status: "active",
                      canRejoin: true,
                    },
                  ],
                },
              }
            );

            console.log("   ✅ FIXED - Added creator");
            fixed++;
          }
        } else {
          // Check if format is correct
          const firstParticipant = trip.participants[0];

          if (!firstParticipant.user) {
            console.log("   ⚠️  Wrong format - FIXING...");

            const newParticipants = trip.participants.map((p) => ({
              user: p._id || p,
              joinedAt: p.joinedAt || trip.createdAt || new Date(),
              joinedVia: p.joinedVia || "invite",
              status: p.status || "active",
              canRejoin: p.canRejoin !== undefined ? p.canRejoin : true,
            }));

            await Trip.updateOne(
              { _id: trip._id },
              { $set: { participants: newParticipants } }
            );

            console.log(
              `   ✅ FIXED - Corrected format for ${newParticipants.length} participants`
            );
            fixed++;
          } else {
            console.log(
              `   ✅ Already correct (${trip.participants.length} participants)`
            );
            skipped++;
          }
        }
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        errors++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`⏭️  Already correct: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📝 Total trips: ${trips.length}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  }
}

emergencyMigration();
