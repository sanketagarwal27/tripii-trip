import React, { useMemo, useState } from "react";
import { X, Search, UserPlus, Check, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addMembers } from "@/api/community";

/* ---------------- AVATAR FALLBACK ---------------- */
const Avatar = ({ user }) => {
  if (user?.profilePicture?.url) {
    return (
      <img
        src={user?.profilePicture?.url}
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }

  const initials = user.username.slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700">
      {initials}
    </div>
  );
};

export default function InviteMembersModal({ communityId, onClose }) {
  const userProfile = useSelector((s) => s.auth.userProfile);
  const communityMembers =
    useSelector((s) => s.community.profile?.members) || [];

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  if (!userProfile) return null;

  /* ---------------- PREP SETS ---------------- */
  const memberIds = useMemo(
    () => new Set(communityMembers.map((m) => m.user?._id)),
    [communityMembers],
  );

  const followerIds = useMemo(
    () => new Set((userProfile.followers || []).map((u) => u._id)),
    [userProfile.followers],
  );

  const followingIds = useMemo(
    () => new Set((userProfile.following || []).map((u) => u._id)),
    [userProfile.following],
  );

  /* ---------------- BUILD CANDIDATES ---------------- */
  const candidates = useMemo(() => {
    const map = new Map();

    [
      ...(userProfile.followers || []),
      ...(userProfile.following || []),
    ].forEach((u) => {
      if (!u?._id) return;

      const isFollower = followerIds.has(u._id);
      const isFollowing = followingIds.has(u._id);

      map.set(u._id, {
        ...u,
        relation:
          isFollower && isFollowing
            ? "both"
            : isFollower
              ? "follower"
              : "following",
        isMember: memberIds.has(u._id),
      });
    });

    return Array.from(map.values());
  }, [userProfile, followerIds, followingIds, memberIds]);

  /* ---------------- FILTER ---------------- */
  const filtered = candidates.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase()),
  );

  /* ---------------- GROUP ---------------- */
  const groups = {
    both: [],
    following: [],
    followers: [],
  };

  filtered.forEach((u) => {
    if (u.relation === "both") groups.both.push(u);
    else if (u.relation === "following") groups.following.push(u);
    else groups.followers.push(u);
  });

  /* ---------------- SELECTION ---------------- */
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const removeSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  /* ---------------- ADD MEMBERS ---------------- */
  const handleAddMembers = async () => {
    if (selectedIds.size === 0) return;

    setLoading(true);
    try {
      const res = await addMembers(communityId, {
        members: Array.from(selectedIds),
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  const Section = ({ title, users }) =>
    users.length > 0 && (
      <div className="py-2">
        <p className="px-4 py-2 text-xs font-bold text-gray-600 uppercase">
          {title}
        </p>
        {users.map((u) => {
          const disabled = u.isMember;
          const checked = selectedIds.has(u._id);

          return (
            <div
              key={u._id}
              onClick={() => !disabled && toggleSelect(u._id)}
              className={`flex items-center justify-between px-4 py-3 
        ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:bg-gray-50"
        }
      `}
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    u?.profilePicture?.url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      u.username,
                    )}&background=random`
                  }
                  alt={u.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold">{u.username}</p>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                </div>
              </div>

              {disabled ? (
                <span className="text-xs text-gray-400 font-semibold">
                  Already a member
                </span>
              ) : (
                <input
                  type="checkbox"
                  checked={checked}
                  onClick={(e) => e.stopPropagation()} // 👈 prevent double toggle
                  onChange={() => toggleSelect(u._id)}
                  className="w-4 h-4 accent-blue-600"
                />
              )}
            </div>
          );
        })}
      </div>
    );

  /* ---------------- RENDER ---------------- */
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">Invite Members</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELECTED CHIPS */}
        {selectedIds.size > 0 && (
          <div className="px-4 py-2 flex gap-2 flex-wrap border-b">
            {Array.from(selectedIds).map((id) => {
              const u = candidates.find((c) => c._id === id);
              if (!u) return null;

              return (
                <div
                  key={id}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                >
                  <img
                    src={
                      u?.profilePicture?.url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        u.username,
                      )}&background=random`
                    }
                    alt={u.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span>{u.username}</span>
                  <button onClick={() => removeSelected(id)}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* SEARCH */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search followers & following..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
            />
          </div>
        </div>

        {/* LIST */}
        <div className="max-h-[300px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-6">
              No users found
            </p>
          ) : (
            <>
              <Section title="Followers & Following" users={groups.both} />
              <Section title="Following" users={groups.following} />
              <Section title="Followers" users={groups.followers} />
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t">
          <button
            onClick={handleAddMembers}
            disabled={selectedIds.size === 0 || loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg"
          >
            <UserPlus className="w-4 h-4" />
            Add {selectedIds.size || ""} Member
            {selectedIds.size !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
