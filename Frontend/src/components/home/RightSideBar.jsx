import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { getSuggestedUsers, followOrUnfollow } from "@/api/users";
import { setSuggestedUser, setUserProfile } from "@/redux/authslice";

const dummyPlaces = [
  {
    id: 1,
    name: "Kyoto, Japan",
    speciality: "Ancient temples & gardens",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuASwsX5KxQqrf_XMJ6OerWEFC15JuSwtX-64zihu4Sg7bwpSMkgfO7IWm3Es4_NbTHCM2StJEvVtYMuBhw18yKHZp43szkjMrEYEcAQf2lmguf8qT32OLBPhyxhVEwMxix3gjmF2nm0eFdm1gR0hm6k_qEp5onQeJUH_z9pKuoD13B1uqp2TzNkKkgalDUOgFguwjZXtHoo0apvI4ffELS-qR5fy41oCz4JwFHFKIQitOw8WO21_A66fn_qNjETgsJryC70Js2YecE",
  },
  {
    id: 2,
    name: "Patagonia, Chile",
    speciality: "Dramatic peaks & ice fjords",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdQX3Gc8X-qjov5mDZEQnZiyt7NSsNpBpiPwPZQTj1VwswSwBMz3kymEJ0pfeMETFfSz8bKL5ct2Hy-Lzuz8kfWM3VJooiwjdiVGbFbR-NLIvsHpEDyjAOBYyJg_3k22GjYNB2oQAnNAA2TGMJ6ZIDYxd9Nd-NHzp8pLoO0aXM-077sUzc9h1ZINncwOYcRkA952XMDGLIx9eVlGUyWuhCY7wWKixB0jxjq0jDFKnD5Wxtv4KJvqa7SrU1sMlzX-TRGCXTSDbDMaU",
  },
];

const RightSideBar = () => {
  const dispatch = useDispatch();
  const { userProfile, suggestedUser } = useSelector((s) => s.auth);

  const [loadingUsers, setLoadingUsers] = useState(false);

  const isFollowing = (userId) => {
    return userProfile.following?.includes(userId);
  };

  if (!userProfile) return null;

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingUsers(true);
        const res = await getSuggestedUsers();
        dispatch(setSuggestedUser(res.data.data.users || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, [dispatch]);

  const toggleFollow = async (id) => {
    try {
      const res = await followOrUnfollow(id);

      if (res?.data?.data?.updatedUser) {
        const updatedProfile = res.data.data.updatedUser;

        // Update current user profile
        dispatch(setUserProfile(updatedProfile));

        dispatch(
          setSuggestedUser(
            suggestedUser.map((u) =>
              u._id === id ? { ...u, _isFollowing: !isFollowing(id) } : u
            )
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const xp = userProfile.xpPoints || 0;
  const bonus = userProfile.bonusPoints || 0;
  const trust = userProfile.trustScore || 0;
  const contrib = userProfile.contributions?.length || 0;
  const trips = userProfile.trips?.length || 0;
  const followers = userProfile.followers?.length || 0;

  const nextXP = userProfile.nextLevelXP || 100;
  const currXP = userProfile.levelProgress || 0;
  const progress = Math.min((currXP / nextXP) * 100, 100);

  const filteredSuggested = suggestedUser?.filter(
    (u) => u._id !== userProfile._id
  );

  console.log("users:", userProfile);
  return (
    <div className="rightsidebar">
      <div className="rightsidebar-inner">
        {/* --- PROFILE CARD --- */}
        <div className="rs-card">
          <div
            className="rs-avatar"
            style={{
              backgroundImage: `url(${
                userProfile.profilePicture?.url || "/travel.jpg"
              })`,
            }}
          ></div>

          <h3 className="rs-name">{userProfile.username}</h3>
          <p className="rs-handle">@{userProfile.username}</p>

          <div className="rs-row">
            <span>XP</span>
            <b>{xp}</b>
          </div>
          <div className="rs-row">
            <span>Bonus</span>
            <b>{bonus}</b>
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
              <b>
                Lv {userProfile.level} (Sub {userProfile.subLevel || 0})
              </b>
            </div>

            <div className="rs-progress">
              <div
                className="rs-progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <p className="rs-xp">
              {currXP}/{nextXP} XP
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
          <h4 className="rs-title">Suggested Places</h4>

          {dummyPlaces.map((p) => (
            <div className="rs-place" key={p.id}>
              <div
                className="rs-place-img"
                style={{ backgroundImage: `url(${p.image})` }}
              ></div>

              <div className="rs-place-info">
                <p className="rs-place-name">{p.name}</p>
                <p className="rs-place-sub">{p.speciality}</p>
                <button className="rs-visit">Visit</button>
              </div>
            </div>
          ))}
        </div>

        {/* --- FRIENDS --- */}
        <div className="rs-card">
          <h4 className="rs-title">Suggested Friends</h4>

          {loadingUsers && <p className="rs-load">Loading...</p>}

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
                  isFollowing(u._id) ? "rs-following" : ""
                }`}
                onClick={() => toggleFollow(u._id)}
              >
                {isFollowing(u._id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSideBar;
