import React, { useState } from "react";
import styles from "./Sidebar.module.css";
import { useDispatch, useSelector } from "react-redux";
import { setUserProfile } from "@/redux/authslice";
import { followOrUnfollow } from "@/api/users";
import toast from "react-hot-toast";

const ProfileSidebar = ({ user, onEditClick }) => {
  const dispatch = useDispatch();

  // 1. Get Logged-in User
  const { userProfile } = useSelector((state) => state.auth);

  // 2. ROBUST 'isFollowing' CHECK
  // This fixes the issue where the button resets on refresh.
  // It checks if the ID exists, whether the list contains Strings OR Objects.
  const isFollowingUser = () => {
    if (!userProfile?.following) return false;

    return userProfile.following.some((item) => {
      const itemId = typeof item === "object" ? item._id : item;
      return itemId === user._id;
    });
  };

  const amIFollowing = isFollowingUser();

  // --- SAFETY HELPER (Prevents Crash & Ensures Saving) ---
  const createSafeUserForRedux = (dirtyUser) => {
    if (!dirtyUser) return null;
    return {
      ...dirtyUser,
      posts: [], // Remove circular reference
      followers: Array.isArray(dirtyUser.followers)
        ? dirtyUser.followers.map((f) => (typeof f === "object" ? f._id : f))
        : [],
      following: Array.isArray(dirtyUser.following)
        ? dirtyUser.following.map((f) => (typeof f === "object" ? f._id : f))
        : [],
    };
  };

  const toggleFollow = async () => {
    if (!userProfile) return toast.error("Please login");

    try {
      // --- 1. Optimistic UI Update ---
      // We manually update the Redux state so the button changes INSTANTLY
      let optimisticFollowing;

      if (amIFollowing) {
        // Unfollow: Filter out the ID (handle both objects and strings)
        optimisticFollowing = userProfile.following.filter((item) => {
          const itemId = typeof item === "object" ? item._id : item;
          return itemId !== user._id;
        });
      } else {
        // Follow: Add the ID
        optimisticFollowing = [...(userProfile.following || []), user._id];
      }

      dispatch(
        setUserProfile({
          ...userProfile,
          following: optimisticFollowing,
        })
      );

      // --- 2. API Call ---
      const res = await followOrUnfollow(user._id);

      // --- 3. Sync with Server (Safe Mode) ---
      if (res?.data?.data?.updatedUser) {
        const safeUser = createSafeUserForRedux(res.data.data.updatedUser);
        dispatch(setUserProfile(safeUser));
      }
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
      // Optional: Reload page or fetch profile again to revert on error
    }
  };

  const EditButtonText =
    user.bio && user.fullName && user.profilePicture?.url && user.address
      ? `Edit Profile`
      : `Complete Profile`;

  const isOwnProfile = user._id === userProfile?._id;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.avatarContainer}>
        <img
          src={user.profilePicture?.url || "/default-avatar.png"}
          alt={user.username}
          className={styles.avatar}
        />
      </div>

      <h2 className={styles.name}>
        {user.fullName ? user.fullName : user.username}
      </h2>
      <h3 className={styles.username}>@{user.username}</h3>
      <p className={styles.title}>{user.bio}</p>

      {/* BUTTON LOGIC */}
      {isOwnProfile ? (
        <button className={styles.editButton} onClick={onEditClick}>
          {EditButtonText}
        </button>
      ) : (
        <button
          className={` ${styles.editButton} ${
            amIFollowing ? styles.followingBtn : styles.followBtn
          }`}
          onClick={toggleFollow}
        >
          {amIFollowing ? "Following" : "Follow"}
        </button>
      )}

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{user.trips?.length || 0}</span>
          <span className={styles.statLabel}>Trips</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {user.followers?.length || 0}
          </span>
          <span className={styles.statLabel}>Followers</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {user.following?.length || 0}
          </span>
          <span className={styles.statLabel}>Following</span>
        </div>
      </div>

      {/* Game Stats */}
      <div className={styles.gameStatsGrid}>
        <div className={styles.gameStat}>
          <h4>XP Points</h4>
          <p>{user.xpPoints}</p>
        </div>
        <div className={styles.gameStat}>
          <h4>Contributions</h4>
          <p>{user.contributions?.length || 0}</p>
        </div>
        <div className={styles.gameStat}>
          <h4>Trust Points</h4>
          <p>{user.trustScore}</p>
        </div>
        <div className={styles.gameStat}>
          <h4>Level</h4>
          <p>{user.level}</p>
        </div>
      </div>

      <div className={styles.levelInfo}>
        <div className={styles.levelHeader}>
          <span>Next Level:</span>
          <span>
            {user.nextLevelXP
              ? ((user.levelProgress * 100) / user.nextLevelXP).toFixed(2)
              : 0}
            %
          </span>
        </div>
        <span className={styles.levelSub}>{user.nextLevel}</span>
        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{
              width: `${
                user.nextLevelXP
                  ? ((user.levelProgress * 100) / user.nextLevelXP).toFixed(2)
                  : 0
              }%`,
            }}
          ></div>
        </div>
        <p className={styles.xpText}>
          {user.nextLevelXP - user.levelProgress} XP to next level
        </p>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
