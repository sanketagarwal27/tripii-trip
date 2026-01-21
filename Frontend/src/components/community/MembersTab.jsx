import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { followOrUnfollow } from "@/api/users";
import { setUserProfile } from "@/redux/authslice";
import { useNavigate } from "react-router-dom";

/* ---------------- ROLE BADGES ---------------- */
const roleBadge = {
  admin: {
    label: "Admin",
    icon: "👑",
    className:
      "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white shadow-[0_0_12px_rgba(234,179,8,0.7)]",
  },
  moderator: {
    label: "Moderator",
    icon: "🛡️",
    className:
      "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.6)]",
  },
  member: {
    label: "Member",
    icon: "🧍",
    className: "bg-gradient-to-r from-slate-500 to-slate-700 text-white",
  },
};

/* ---------------- COMPONENT ---------------- */
export default function MembersTab({ adminOnly = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const communityMembers =
    useSelector((s) => s.community.profile?.members) || [];

  const userProfile = useSelector((s) => s.auth.userProfile);
  if (!userProfile) return null;

  /* ---------- FOLLOW LOGIC (FIXED FOR OBJECT ARRAY) ---------- */
  /* ---------- FOLLOW LOGIC (ROBUST) ---------- */
  const followingIds = useMemo(() => {
    return new Set(
      (userProfile.following || []).map((f) =>
        typeof f === "string" ? f : f._id || f.id,
      ),
    );
  }, [userProfile.following]);

  const isFollowing = (userId) => followingIds.has(userId);

  const toggleFollow = async (userId) => {
    try {
      const res = await followOrUnfollow(userId);
      if (res?.data?.data?.updatedUser) {
        dispatch(setUserProfile(res.data.data.updatedUser));
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- SORT + FILTER ---------- */
  const orderedList = useMemo(() => {
    const filtered = communityMembers.filter((m) => {
      const name = (m.displayName || m.user?.username || "").toLowerCase();
      return name.includes(search.toLowerCase());
    });

    const me = [];
    const admins = [];
    const moderators = [];
    const members = [];

    filtered.forEach((m) => {
      if (m.user?._id === userProfile._id) me.push(m);
      else if (m.role === "admin") admins.push(m);
      else if (m.role === "moderator") moderators.push(m);
      else members.push(m);
    });

    members.sort((a, b) =>
      (a.displayName || a.user.username).localeCompare(
        b.displayName || b.user.username,
      ),
    );

    return [...me, ...admins, ...moderators, ...members];
  }, [communityMembers, search, userProfile._id]);

  /* ---------- RENDER ---------- */
  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border p-4 border-border-light">
      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search members..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-cyan-400 text-sm"
      />

      {orderedList.length ? (
        <ul className="flex flex-col gap-2">
          {orderedList.map((m) => {
            const user = m.user;
            if (!user) return null;

            const name = m.displayName || user.username;
            const following = isFollowing(user._id);

            return (
              <li
                key={m._id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-background-light transition"
              >
                {/* LEFT */}
                <div
                  className="flex items-center gap-3 min-w-0"
                  onClick={() => navigate(`/profile/${user?._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={
                      user?.profilePicture?.url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        name,
                      )}&background=random`
                    }
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">
                        {name}
                        {user._id === userProfile._id && (
                          <span className="text-cyan-500"> (You)</span>
                        )}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          roleBadge[m.role].className
                        }`}
                      >
                        {roleBadge[m.role].icon} {roleBadge[m.role].label}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted-light">
                      @{user.username}
                    </p>
                  </div>
                </div>

                {/* RIGHT ACTIONS */}
                {user._id !== userProfile._id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFollow(user._id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition
                        ${
                          following
                            ? "bg-cyan-100 text-cyan-700"
                            : "bg-cyan-500 text-white hover:bg-cyan-600"
                        }`}
                    >
                      {following ? "Following" : "Follow"}
                    </button>

                    <button className="px-3 py-1.5 rounded-full text-xs font-bold border border-cyan-400 text-cyan-600 hover:bg-cyan-50 transition">
                      Message
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-text-muted-light">No members found.</p>
      )}
    </div>
  );
}
