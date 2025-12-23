import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { History, Cake, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getSimilarCommunities } from "@/api/community";
import ActivityItem from "./ActivityItem";
import { formatDate, ROOM_STATUS_META } from "../common/roomStatus";

export default function RightSidebar({ profile }) {
  const navigate = useNavigate();
  // 🔥 Get rooms from Redux store - will update in real-time via socket
  const rooms = useSelector((s) => s.community.rooms || []);
  const activities = useSelector((s) => s.community.activities || []);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [similarCommunities, setSimilarCommunities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch similar communities based on tags
  useEffect(() => {
    if (!profile?._id || !profile?.tags?.length) {
      setSimilarCommunities([]);
      return;
    }

    const fetchSimilar = async () => {
      setLoading(true);
      try {
        const res = await getSimilarCommunities(profile._id, { limit: 10 });
        setSimilarCommunities(res?.data?.data?.communities || []);
      } catch (err) {
        console.error("Failed to fetch similar communities:", err);
        setSimilarCommunities([]);
      }
      setLoading(false);
    };

    fetchSimilar();
  }, [profile?._id, profile?.tags]);

  const visibleActivities = showAllActivities
    ? activities
    : activities.slice(0, 5);
  const rules = Array.isArray(profile.rules) ? profile.rules : [];

  return (
    <div className="space-y-4 w-80">
      {/* ---------------- ROOMS - 🔥 REAL-TIME UPDATES ---------------- */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "rgba(250,250,250,1)" }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold">Rooms</h3>
          <button
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            onClick={() => navigate(`/community/${profile._id}/createRoom`)}
          >
            + Create Room
          </button>
        </div>

        {rooms.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {rooms.slice(0, 6).map((r) => {
              const statusMeta =
                ROOM_STATUS_META[r.status] || ROOM_STATUS_META.upcoming;

              return (
                <li key={r._id}>
                  <div
                    onClick={() =>
                      navigate(`/community/${r.parentCommunity}/room/${r._id}`)
                    }
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition"
                    style={{ cursor: "pointer" }}
                  >
                    {/* ROOM IMAGE */}
                    <div
                      className="bg-cover bg-center rounded-md w-10 h-10 shrink-0"
                      style={{
                        backgroundImage: `url(${
                          r.roombackgroundImage?.url || ""
                        })`,
                        borderRadius: "50%",
                      }}
                    />

                    {/* ROOM INFO */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs font-semibold truncate">
                        {r.name} ·{" "}
                        <span
                          style={{
                            color: "red",
                            fontSize: "10px",
                            fontWeight: "700",
                          }}
                        >
                          {r.roomtype === "Trip" ? "Trip" : "Norm"}
                        </span>
                      </span>

                      <span className="text-[11px] text-gray-500">
                        {r.members?.length || 0} members ·{" "}
                        {formatDate(r.createdAt)}
                      </span>
                    </div>

                    {/* STATUS BADGE */}
                    <span
                      className="text-[10px] font-semibold px-2 py-1 rounded-full"
                      style={{
                        color: statusMeta.color,
                        backgroundColor: statusMeta.bg,
                      }}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-gray-600">No rooms yet</p>
        )}

        {rooms.length > 6 && (
          <button
            onClick={() => navigate(`/community/${profile._id}?tab=rooms`)}
            className="block mt-2 text-xs text-blue-600 hover:underline w-full text-left"
          >
            Show all {rooms.length} rooms
          </button>
        )}
      </div>

      {/* ---------------- ACTIVITY ---------------- */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "rgba(250,250,250,1)" }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm">Recent Activity</h3>
          <History size={16} className="text-gray-500" />
        </div>

        {visibleActivities.length > 0 ? (
          <div className="flex flex-col gap-3">
            {visibleActivities.map((a, i) => (
              <ActivityItem
                key={a._id || i}
                a={a}
                isLast={i === visibleActivities.length - 1}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-600">No recent activity</p>
        )}

        {activities.length > 5 && (
          <button
            onClick={() => setShowAllActivities((s) => !s)}
            className="mt-3 w-full rounded-full h-8 bg-white text-xs font-semibold hover:bg-gray-50 transition"
          >
            {showAllActivities ? "Show less" : "View all activity"}
          </button>
        )}
      </div>

      {/* ---------------- ABOUT ---------------- */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "rgba(250,250,250,1)" }}
      >
        <h3 className="font-bold text-sm mb-3">About Community</h3>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="font-bold text-base">
              {profile.memberCount || 0}
            </div>
            <div className="text-xs text-gray-600">Members</div>
          </div>
          <div>
            <div className="font-bold text-base">
              {profile.roomsLast7DaysCount || 0}
            </div>
            <div className="text-xs text-gray-600">Rooms/Week</div>
          </div>
        </div>

        {/* CREATED DATE */}
        <div className="text-xs text-gray-600 flex items-center gap-2 mb-2">
          <Cake size={14} />
          Created{" "}
          {new Date(
            profile.createdAt || profile.updatedAt
          ).toLocaleDateString()}
        </div>

        {/* COMMUNITY TYPE */}
        <div className="text-xs text-gray-600 mb-3">
          <span className="font-semibold">Type:</span>{" "}
          {profile.type
            ?.replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </div>

        {/* DESCRIPTION */}
        {profile.description && (
          <div>
            <div className="text-xs font-semibold text-gray-800 mb-1">
              Description
            </div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {profile.description}
            </div>
          </div>
        )}
      </div>

      {/* ---------------- RULES ---------------- */}
      {rules.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "rgba(250,250,250,1)" }}
        >
          <h4 className="font-bold text-sm mb-3">Community Rules</h4>
          <div className="flex flex-col gap-3">
            {rules.map((r, idx) => (
              <div key={r._id || idx} className="text-xs">
                <div className="font-semibold text-gray-800 mb-1">
                  {idx + 1}. {r.title}
                </div>
                {r.description && (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {r.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- SIMILAR COMMUNITIES ---------------- */}
      {profile.tags?.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "rgba(250,250,250,1)" }}
        >
          <h3 className="text-md mb-3">Communities of your taste</h3>

          {loading ? (
            <p className="text-xs text-gray-600">Loading...</p>
          ) : similarCommunities.length > 0 ? (
            <div className="flex flex-col gap-2">
              {similarCommunities.map((comm) => (
                <Link
                  key={comm._id}
                  to={`/community/${comm._id}`}
                  className="flex items-center gap-2 rounded-lg hover:bg-white transition group"
                >
                  <div
                    className="w-10 h-10 rounded-full bg-cover bg-center bg-gray-300 flex-shrink-0"
                    style={{
                      backgroundImage: `url(${
                        comm.backgroundImage?.url || ""
                      })`,
                    }}
                  />
                  <span className="text-md text-gray-800 group-hover:text-blue-600 transition truncate">
                    {comm.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600">
              No similar communities found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
