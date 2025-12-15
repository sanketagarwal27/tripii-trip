import React, { useState } from "react";
import { useSelector } from "react-redux";
import ActivityItem from "./ActivityItem";

export default function RightSidebar({ profile }) {
  const activities = useSelector((s) => s.community.activities || []);
  const [showAll, setShowAll] = useState(false);

  /* ---------------- ADMINS ---------------- */
  const admins =
    profile.members?.filter((m) => ["admin", "owner"].includes(m.role)) || [];

  /* ---------------- ACTIVITIES ---------------- */
  const visibleActivities = showAll ? activities : activities.slice(0, 5);

  /* ---------------- RULES ---------------- */
  const rules = Array.isArray(profile.rules) ? profile.rules : [];

  return (
    <div className="space-y-6">
      {/* ---------------- ADMINS ---------------- */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light p-5">
        <h3 className="font-bold mb-3">Community Admins</h3>

        {admins.length ? (
          <div className="flex flex-col gap-3">
            {admins.map((a) => (
              <div key={a._id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${
                      a.user?.profilePicture?.url || ""
                    })`,
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {a.displayName || a.user?.username}
                  </span>
                  <span className="text-xs text-text-muted-light">
                    {a.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted-light">No admins listed.</p>
        )}
      </div>

      {/* ---------------- ACTIVITY ---------------- */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Activities in Community</h3>
          <span className="material-symbols-outlined text-text-muted-light">
            history
          </span>
        </div>

        {visibleActivities.length ? (
          <div className="flex flex-col gap-4">
            {visibleActivities.map((a, i) => (
              <ActivityItem
                key={a._id}
                a={a}
                isLast={i === visibleActivities.length - 1}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted-light">No recent activity</p>
        )}

        {activities.length > 5 && (
          <button
            onClick={() => setShowAll((s) => !s)}
            className="mt-4 w-full rounded-full h-9 border border-border-light text-xs font-bold hover:bg-background-light transition"
          >
            {showAll ? "Hide activity" : "View all activity"}
          </button>
        )}
      </div>

      {/* ---------------- ABOUT ---------------- */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light p-5">
        <h3 className="font-bold mb-3">About Community</h3>

        {/* STATS */}
        <div className="flex gap-6 mb-4">
          <div>
            <div className="font-bold text-lg">{profile.memberCount || 0}</div>
            <div className="text-xs text-text-muted-light">Members</div>
          </div>

          <div>
            <div className="font-bold text-lg">
              {profile.rooms?.length ?? profile.roomsLast7DaysCount ?? 0}
            </div>
            <div className="text-xs text-text-muted-light">Rooms</div>
          </div>
        </div>

        {/* CREATED DATE */}
        <div className="text-xs text-text-muted-light flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined !text-base">cake</span>
          Created{" "}
          {new Date(
            profile.createdAt || profile.updatedAt
          ).toLocaleDateString()}
        </div>

        {/* RULES */}
        {rules.length ? (
          <div className="border-t pt-3 text-sm">
            <h4 className="font-bold mb-2">Community Rules</h4>
            <ul className="flex flex-col gap-1 text-text-muted-light">
              {rules.map((r, idx) => (
                <li key={idx}>• {r}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="border-t pt-3 text-sm text-text-muted-light">
            No community rules added.
          </div>
        )}
      </div>
    </div>
  );
}
