import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";
import { getLoggedInUser } from "@/api/auth";

const ProfileSidebar = ({ user, onEditClick }) => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await getLoggedInUser();
        setLoggedInUser(response.data);
      } catch (err) {
        console.log(err);
      }
    };
    getCurrentUser();
  }, [user._id]);

  const EditButton =
    user.bio !== "" &&
    user.fullName !== "" &&
    user.privacy !== "" &&
    user.address !== "" &&
    user.profilePicture.url !== ""
      ? `Edit Profile`
      : `Complete Profile`;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.avatarContainer}>
        <img
          src={
            user.profilePicture.url !== ""
              ? user.profilePicture.url
              : `https://pixabay.com/images/download/blank-profile-picture-973460_1920.png`
          }
          alt={user.username}
          className={styles.avatar}
        />
      </div>

      <h2 className={styles.name}>
        {user.fullName ? user.fullName : user.username}
      </h2>
      <p className={styles.title}>{user.bio}</p>

      {user._id === loggedInUser?.id && (
        <button className={styles.editButton} onClick={onEditClick}>
          {EditButton}
        </button>
      )}

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{user.trips.length}</span>
          <span className={styles.statLabel}>Trips</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{user.followers.length}</span>
          <span className={styles.statLabel}>Followers</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{user.following.length}</span>
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
          <p>{user.contributions.length}</p>
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
            {((user.levelProgress * 100) / user.nextLevelXP).toFixed(2)}%
          </span>
        </div>
        <span className={styles.levelSub}>{user.nextLevel}</span>
        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{
              width: `${((user.levelProgress * 100) / user.nextLevelXP).toFixed(
                2
              )}%`,
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
