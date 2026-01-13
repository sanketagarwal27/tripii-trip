import mongoose from "mongoose";
import dotenv from "dotenv";
import { Post } from "../models/user/post.model";

dotenv.config();

/**
 * This migration converts:
 * likes: [ObjectId]
 * →
 * likes: [{ user: ObjectId, likedAt: Date }]
 */

const runMigration = async () => {
  try {
    console.log("🚀 Starting likes migration...");

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGODB_DB_NAME, // optional but recommended
    });

    console.log("✅ MongoDB connected");

    // Count affected documents
    const count = await Post.countDocuments({
      "likes.0": { $type: "objectId" },
    });

    if (count === 0) {
      console.log("ℹ️ No posts need migration. Exiting.");
      process.exit(0);
    }

    console.log(`🔄 Migrating ${count} posts...`);

    const result = await Post.updateMany({ "likes.0": { $type: "objectId" } }, [
      {
        $set: {
          likes: {
            $map: {
              input: "$likes",
              as: "u",
              in: {
                user: "$$u",
                likedAt: new Date(),
              },
            },
          },
        },
      },
    ]);

    console.log("✅ Migration completed");
    console.log("Modified documents:", result.modifiedCount);

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

runMigration();
