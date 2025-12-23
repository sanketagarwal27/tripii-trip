// src/components/community/CommunityTabs.jsx
import React, { useState } from "react";
import DiscussionTab from "./DiscussionTab.jsx";
import MembersTab from "./MembersTab.jsx";
import PinnedMessages from "./PinnedMessages.jsx";
import RoomsTab from "./RoomTab.jsx";

const tabs = ["Discussion", "Rooms", "Pins", "Helpfulls", "Members", "Setting"];

const CommunityTabs = () => {
  const [active, setActive] = useState("Discussion");

  return (
    <div className="overflow-hidden">
      <div className="flex w-full overflow-x-auto no-scrollbar gap-1 p-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-4 py-2 rounded-lg ${
              active === t
                ? "bg-primary/10 text-primary font-bold"
                : "text-text-muted-light dark:text-text-muted-dark"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted-light font-bold uppercase">
            Sort by:
          </span>
          <button className="text-sm font-bold">
            Hot{" "}
            <span className="material-symbols-outlined !text-[18px]">
              expand_more
            </span>
          </button>
        </div>
      </div>

      <div className="p-4">
        {active === "Discussion" && <DiscussionTab />}
        {active === "Rooms" && <RoomsTab />}
        {active === "Pins" && <PinnedMessages />}
        {active === "Members" && <MembersTab />}
        {active === "Admins" && <MembersTab adminOnly />}
      </div>
    </div>
  );
};

export default CommunityTabs;
