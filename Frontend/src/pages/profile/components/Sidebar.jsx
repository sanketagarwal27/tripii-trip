import React from "react";
import styles from "./Sidebar.module.css";
import { useDispatch, useSelector } from "react-redux";
import { setUserProfile } from "@/redux/authslice";
import { followOrUnfollow } from "@/api/users";
import { LEVEL_STYLES } from "@/utils/levels.js";
import toast from "react-hot-toast";

const ProfileSidebar = ({ user, onEditClick }) => {
  const dispatch = useDispatch();
  const { userProfile } = useSelector((state) => state.auth);

  // --- LEVEL STYLING LOGIC ---
  const currentLevelStyle = LEVEL_STYLES[user.level] || LEVEL_STYLES[1];

  // Safe check for Next Level (Prevents crash if user is max level)
  const nextLevelStyle = LEVEL_STYLES[user.level + 1];
  const isMaxLevel = !nextLevelStyle;

  // Determine specific text color (Prefer 'text' prop, fallback to 'color')
  const textColor =
    currentLevelStyle.text === "#FFFFFF"
      ? currentLevelStyle.color
      : currentLevelStyle.text || currentLevelStyle.color;

  // Robust 'isFollowing' Check
  const isFollowingUser = () => {
    if (!userProfile?.following) return false;
    return userProfile.following.some((item) => {
      const itemId = typeof item === "object" ? item._id : item;
      return itemId === user._id;
    });
  };

  const amIFollowing = isFollowingUser();

  // Safety Helper
  const createSafeUserForRedux = (dirtyUser) => {
    if (!dirtyUser) return null;
    return {
      ...dirtyUser,
      posts: [],
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
      let optimisticFollowing;
      if (amIFollowing) {
        optimisticFollowing = userProfile.following.filter((item) => {
          const itemId = typeof item === "object" ? item._id : item;
          return itemId !== user._id;
        });
      } else {
        optimisticFollowing = [...(userProfile.following || []), user._id];
      }

      dispatch(
        setUserProfile({ ...userProfile, following: optimisticFollowing })
      );

      const res = await followOrUnfollow(user._id);

      if (res?.data?.data?.updatedUser) {
        const safeUser = createSafeUserForRedux(res.data.data.updatedUser);
        dispatch(setUserProfile(safeUser));
      }
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  const EditButtonText =
    user.bio && user.fullName && user.profilePicture?.url && user.address
      ? `Edit Profile`
      : `Complete Profile`;

  const isOwnProfile = user._id === userProfile?._id;

  return (
    <aside className={styles.sidebar}>
      {/* 1. Avatar with Dynamic Border Color */}
      <div className={styles.avatarContainer}>
        <img
          src={user.profilePicture?.url || "/default-avatar.png"}
          alt={user.username}
          className={styles.avatar}
          style={{
            // Use .color for structural elements (Border)
            borderColor: currentLevelStyle.color,
            boxShadow:
              user.level >= 7
                ? `0 0 15px ${currentLevelStyle.color}40`
                : "none",
          }}
        />
      </div>

      <h2 className={styles.name}>
        {user.fullName ? user.fullName : user.username}
      </h2>

      <h3 className={styles.username}>@{user.username}</h3>

      {/* 2. Level Name Display */}
      <div className={styles.levelBadge}>
        {/* Icon is standard */}
        <span style={{ marginRight: "6px", fontSize: "1.2em" }}>
          {currentLevelStyle.icon}
        </span>

        {/* The Text Span gets the Gradient */}
        <span
          style={{
            color: textColor, // Fallback
            ...(currentLevelStyle.bgGradient && {
              backgroundImage: currentLevelStyle.bgGradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              display: "inline-block", // Important for gradients to render correctly
            }),
          }}
        >
          {currentLevelStyle.label}
        </span>
      </div>

      <p className={styles.title}>{user.bio}</p>

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
          <p style={{ color: currentLevelStyle.color }}>{user.level}</p>
        </div>
      </div>

      {/* 3. Level Info & Progress Bar */}
      <div className={styles.levelInfo}>
        <div className={styles.levelHeader}>
          <span>
            {isMaxLevel
              ? "Max Level Reached"
              : `Next Level: ${nextLevelStyle?.label}`}
          </span>
          {!isMaxLevel && <span>{user.levelProgress}%</span>}
        </div>

        {!isMaxLevel && (
          <>
            <span className={styles.levelSub}>{user.nextLevel}</span>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${user.levelProgress}%`,
                  backgroundColor: currentLevelStyle.color,
                }}
              ></div>
            </div>
            <p className={styles.xpText}>{user.nextLevelXP} XP to next level</p>
          </>
        )}
      </div>
    </aside>
  );
};

export default ProfileSidebar;
