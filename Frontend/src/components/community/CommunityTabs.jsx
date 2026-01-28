// src/components/community/CommunityTabs.jsx
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";

import DiscussionTab from "./DiscussionTab.jsx";
import MembersTab from "./MembersTab.jsx";
import PinnedMessages from "./PinnedMessages.jsx";
import RoomsTab from "./RoomTab.jsx";
import HelpfulMessages from "./HelpfulMessageTab.jsx";
import CommSetting from "./Setting.jsx";

const CommunityTabs = ({ showAboutModal, setShowAboutModal }) => {
  const [active, setActive] = useState("Discussion");
  const [sortBy, setSortBy] = useState("recent");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const role = useSelector((s) => s.community.profile?.currentUserRole);

  const isAdmin = role === "admin";
  const isModerator = role === "moderator";

  const tabs = useMemo(() => {
    const baseTabs = ["Discussion", "Rooms", "Pins", "Helpfulls", "Members"];
    if (isAdmin || isModerator) {
      baseTabs.push("Setting");
    }
    return baseTabs;
  }, [isAdmin, isModerator]);

  React.useEffect(() => {
    if (!tabs.includes(active)) {
      setActive("Discussion");
    }
  }, [tabs, active]);

  const sortOptions = [
    { value: "helpful", label: "Most Helpful" },
    { value: "pinned", label: "Pinned" },
    { value: "comments", label: "Most Comments" },
    { value: "recent", label: "Recent" },
  ];

  const handleSortChange = (value) => {
    setSortBy(value);
    setShowSortDropdown(false);
  };

  return (
    <div className="overflow-hidden" onClick={() => setShowSortDropdown(false)}>
      {/* About Button - Mobile Only */}
      <div className="flex gap-2 p-3 xl:hidden">
        <button
          onClick={() => setShowAboutModal(!showAboutModal)}
          className={`about-button-mobile ${showAboutModal ? "active" : ""}`}
        >
          <span className="material-symbols-outlined !text-[18px]">info</span>
          About
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex w-full overflow-x-auto no-scrollbar gap-1 p-3 community-tabs-wrapper">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-4 py-2 rounded-lg transition ${
              active === t
                ? "bg-primary/10 text-primary font-bold"
                : "text-text-muted-light dark:text-text-muted-dark"
            }`}
          >
            {t}
          </button>
        ))}

        {/* Sort Dropdown */}
        <div className="ml-auto flex items-center gap-2 relative sort-dropdown-container">
          <span className="text-xs text-text-muted-light font-bold uppercase hidden sm:inline">
            Sort by:
          </span>
          <button
            className="text-sm font-bold sort-dropdown-mobile flex items-center gap-1"
            onClick={(e) => {
              setShowSortDropdown(!showSortDropdown);
              e.stopPropagation();
            }}
          >
            {sortOptions.find((o) => o.value === sortBy)?.label}
            <span className="material-symbols-outlined !text-[18px]">
              expand_more
            </span>
          </button>

          {showSortDropdown && (
            <div
              className="sort-dropdown-menu"
              onClick={(e) => e.stopPropagation()}
            >
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={sortBy === option.value ? "active" : ""}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content - Remove padding on mobile */}
      <div className="xl:p-4">
        {active === "Discussion" && <DiscussionTab sortBy={sortBy} />}
        {active === "Rooms" && <RoomsTab />}
        {active === "Pins" && <PinnedMessages />}
        {active === "Members" && <MembersTab />}
        {active === "Helpfulls" && <HelpfulMessages />}
        {(isAdmin || isModerator) && active === "Setting" && <CommSetting />}
      </div>
    </div>
  );
};

export default CommunityTabs;
