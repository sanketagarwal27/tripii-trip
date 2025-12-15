// src/components/community/ActivityItem.jsx
import React from "react";

const ActivityItem = ({ a }) => {
  const actor = a.actor || {};
  const map = {
    community_created: "Community created",
    room_created: "Room created",
    trip_created: "Trip created",
    poll: "Poll created",
    member_added: "Member added",
    settings_updated: "Settings updated",
  };

  return (
    <div className="flex gap-3">
      <div className="z-10">
        <div className="bg-primary/10 p-1.5 rounded-full text-primary flex items-center justify-center">
          <span className="material-symbols-outlined !text-[14px]">
            history
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <p className="text-sm text-text-light font-medium">
          {map[a.type] || a.type}
        </p>
        <p className="text-xs text-text-muted-light">
          {actor.username || "Someone"} •{" "}
          {new Date(a.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;
