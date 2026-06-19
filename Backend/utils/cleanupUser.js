import { User } from "../models/user/user.model.js";
import mongoose from "mongoose";

export const cleanupInvalidFollowing = async () => {
  try {
    const users = await User.find({});

    for (const user of users) {
      // Clean following list
      const validFollowing = user.following.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );

      // Clean followers list
      const validFollowers = user.followers.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );

      if (
        validFollowing.length !== user.following.length ||
        validFollowers.length !== user.followers.length
      ) {
        await User.findByIdAndUpdate(user._id, {
          following: validFollowing,
          followers: validFollowers,
        });
      }
    }

    console.log("User following/followers cleanup completed");
  } catch (error) {
    console.error("Error in user cleanup:", error);
  }
};
