import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import { getSuggestedUsers, followOrUnfollow } from "@/api/users";
import { setSuggestedUser, setUserProfile } from "@/redux/authslice";
import { getSuggestedPlaces } from "@/api/places";
import { LEVEL_STYLES } from "@/utils/levels.js";

const RightSideBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- 1. STATE FOR PLACES ---
  const [places, setPlaces] = useState([]); // Store places here
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  // --- 2. FETCH PLACES (Inside useEffect) ---
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoadingPlaces(true);
        const res = await getSuggestedPlaces();
        setPlaces(res.data || []);
      } catch (err) {
        console.error("Error fetching places:", err);
      } finally {
        setLoadingPlaces(false);
      }
    };

    loadPlaces();
  }, []);

  const handlePlaceClick = (placeName) => {
    navigate(`/places/?query=${placeName}`);
  };

  const { userProfile, suggestedUser } = useSelector((s) => s.auth);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // --- FETCH USERS ---
  useEffect(() => {
    if (!userProfile) return; // Guard clause inside hook logic if needed or before
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await getSuggestedUsers();

        const users = (res.data.data.users || []).map((u) => ({
          ...u,
          _isFollowing: userProfile.following?.includes(u._id),
        }));

        dispatch(setSuggestedUser(users));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [dispatch, userProfile?.following]); // Added userProfile.following dependency for proper re-renders

  if (!userProfile) return null; // Moved after hooks to prevent hook errors

  // --- STYLE LOGIC ---
  // Get current level style for border color
  const currentLevelStyle = LEVEL_STYLES[userProfile.level] || LEVEL_STYLES[1];

  const toggleFollow = async (id) => {
    try {
      // Optimistic UI update
      dispatch(
        setSuggestedUser(
          suggestedUser.map((u) =>
            u._id === id ? { ...u, _isFollowing: !u._isFollowing } : u
          )
        )
      );

      const res = await followOrUnfollow(id);

      if (res?.data?.data?.updatedUser) {
        dispatch(setUserProfile(res.data.data.updatedUser));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const xp = userProfile.xpPoints || 0;
  // const bonus = userProfile.bonusPoints || 0; // Unused
  const trust = userProfile.trustScore || 0;
  const contrib = userProfile.contributions?.length || 0;
  const trips = userProfile.trips?.length || 0;
  const followers = userProfile.followers?.length || 0;

  const nextXP = userProfile.nextLevelXP || 100;
  const currXP = userProfile.levelProgress || 0;
  // const progress = Math.min((currXP / nextXP) * 100, 100); // Unused

  const filteredSuggested = suggestedUser?.filter(
    (u) => u._id !== userProfile._id
  );

  return (
    <div className="rightsidebar">
      <div className="rightsidebar-inner">
        {/* --- PROFILE CARD --- */}
        <div className="rs-card">
          <Link to={`/profile/${userProfile._id}`}>
            <div
              className="rs-avatar"
              style={{
                backgroundImage: `url(${
                  userProfile.profilePicture?.url || "/travel.jpg"
                })`,
                // --- NEW: Dynamic Border Color ---
                border: `3px solid ${currentLevelStyle.color}`,
                // Optional: Add glow for high levels
                boxShadow:
                  userProfile.level >= 7
                    ? `0 0 10px ${currentLevelStyle.color}40`
                    : "none",
              }}
            ></div>
          </Link>
          <Link to={`/profile/${userProfile._id}`}>
            <h3 className="rs-name">
              {userProfile.fullName
                ? userProfile.fullName
                : userProfile.username}
            </h3>
            <p className="rs-handle">@{userProfile.username}</p>
          </Link>
          <div className="rs-row">
            <span>XP</span>
            <b>{xp}</b>
          </div>

          <div className="rs-row">
            <span>Trust</span>
            <b>{trust}</b>
          </div>
          <div className="rs-row">
            <span>Contribs</span>
            <b>{contrib}</b>
          </div>

          <div className="rs-level-box">
            <div className="rs-row">
              <span>Level</span>
              <b style={{ color: currentLevelStyle.color }}>
                {/* Ensure label exists safely */}
                {LEVEL_STYLES[userProfile.level]?.label} Lv {userProfile.level}
              </b>
            </div>

            <div className="rs-progress">
              <div
                className="rs-progress-fill"
                style={{
                  width: `${currXP}%`,
                  // Make progress bar match level color
                  backgroundColor: currentLevelStyle.color,
                }}
              ></div>
            </div>

            <p className="rs-xp">
              {currXP}%, {nextXP} Xp more
            </p>
          </div>

          <div className="rs-stats">
            <div>
              <b>{trips}</b>
              <p>Trips</p>
            </div>
            <div>
              <b>{contrib}</b>
              <p>Contrib</p>
            </div>
            <div>
              <b>{followers}</b>
              <p>Followers</p>
            </div>
          </div>
        </div>

        {/* --- PLACES --- */}
        <div className="rs-card">
          <div className="rs-header">
            <h4 className="rs-title">Trending Destinations</h4>
            {/* Optional: Add a 'See all' link if you have one */}
          </div>

          {loadingPlaces && <div className="rs-loading-skeleton"></div>}

          {!loadingPlaces && places.length === 0 && (
            <p className="rs-empty">No places found</p>
          )}

          <div className="rs-places-list">
            {places.slice(0, 3).map((p) => (
              <div
                className="rs-place-card"
                key={p._id}
                onClick={() => handlePlaceClick(p.place)}
              >
                {/* Image Section */}
                <div
                  className="rs-place-img"
                  style={{
                    backgroundImage: `url(${p.heroImageUrl || "/travel.jpg"})`,
                  }}
                >
                  {/* Optional: Rating badge overlay */}
                  <span className="rs-place-rating">
                    ★ {p.overview?.aiData?.overallRating || "4.5"}
                  </span>
                </div>

                {/* Content Section */}
                <div className="rs-place-content">
                  <h5 className="rs-place-name">{p.place}</h5>

                  {/* Render Tags as Mini Pills */}
                  <div className="rs-place-tags">
                    {p.overview?.aiData?.bestFor?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="rs-tag-pill">
                        {tag}
                      </span>
                    ))}
                    {/* If more than 2 tags, show a small dot */}
                    {(p.overview?.aiData?.bestFor?.length || 0) > 2 && (
                      <span className="rs-tag-more">+</span>
                    )}
                  </div>

                  <div className="rs-place-footer">
                    {/* Price Indicator */}
                    <span className="rs-price">
                      {p.overview?.aiData?.budgetRating === "Expensive"
                        ? "$$$"
                        : p.overview?.aiData?.budgetRating === "Moderate"
                        ? "$$"
                        : "$"}
                    </span>
                    <button className="rs-visit-btn">View &rarr;</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- FRIENDS --- */}
        <div className="rs-card">
          <h4 className="rs-title">Suggested Friends</h4>

          {loadingUsers && <p className="rs-load">Loading...</p>}
          <div className="rs-friend-list">
            {filteredSuggested?.slice(0, 10).map((u) => (
              <div className="rs-friend" key={u._id}>
                <div className="rs-friend-left">
                  <div
                    className="rs-friend-img"
                    style={{
                      backgroundImage: `url(${
                        u.profilePicture?.url || "/travel.jpg"
                      })`,
                    }}
                  ></div>

                  <div>
                    <p className="rs-friend-name">{u.username}</p>
                    <p className="rs-friend-sub">Suggested for you</p>
                  </div>
                </div>

                <button
                  className={`rs-follow ${
                    u._isFollowing ? "rs-following" : ""
                  }`}
                  onClick={() => toggleFollow(u._id)}
                >
                  {u._isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSideBar;
