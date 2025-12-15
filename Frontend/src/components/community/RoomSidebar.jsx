// src/components/community/RoomsSidebar.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function RoomsSidebar() {
  const rooms = useSelector((s) => s.community.rooms || []);

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border p-4 border-border-light">
      <h3 className="text-lg font-bold">All Rooms</h3>
      <ul className="flex flex-col gap-2 mt-3">
        {rooms && rooms.length ? (
          rooms.slice(0, 6).map((r) => (
            <li key={r._id}>
              <Link
                to={`/room/${r._id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10"
              >
                <div
                  className="bg-cover bg-center rounded-md aspect-square w-10 h-10"
                  style={{
                    backgroundImage: `url(${r.roombackgroundImage?.url || ""})`,
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-text-muted-light">
                    {r.members?.length || 0} members
                  </span>
                </div>
              </Link>
            </li>
          ))
        ) : (
          <li className="text-text-muted-light">No rooms yet</li>
        )}
      </ul>

      <a className="block mt-3 text-sm text-primary hover:underline">
        Show all rooms
      </a>
    </div>
  );
}
