// src/components/community/MembersTab.jsx
import React from "react";
import { useSelector } from "react-redux";

export default function MembersTab({ adminOnly = false }) {
  const members = useSelector((s) => s.community.profile?.members || []);

  const list = adminOnly
    ? members.filter((m) => ["admin", "owner"].includes(m.role))
    : members;

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border p-4 border-border-light">
      {list.length ? (
        <ul className="flex flex-col gap-3">
          {list.map((m) => (
            <li key={m._id} className="flex items-center gap-3">
              <div
                className="bg-cover bg-center rounded-full w-10 h-10"
                style={{
                  backgroundImage: `url(${m.user?.profilePicture?.url || ""})`,
                }}
              />
              <div>
                <div className="font-bold">
                  {m.displayName || m.user?.username}
                </div>
                <div className="text-xs text-text-muted-light">{m.role}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted-light">No members found.</p>
      )}
    </div>
  );
}
