// src/components/layout/LeftSidebar.jsx
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { DoorOpenIcon, Tag, Users } from "lucide-react";
import { socket } from "../../../Socket.js";
import { moveCommunityToTop } from "@/redux/communitySlice";
import Image from "../../../public/travel.jpg";
import { useNavigate } from "react-router-dom";

/* ---------- Community Row ---------- */
const CommunitySidebarItem = ({ community }) => {
  const [showTags, setShowTags] = useState(false);
  const tags = Array.isArray(community?.tags) ? community.tags : [];
  const navigate = useNavigate();

  return (
    <div
      className="ls-community-row"
      onClick={() => navigate(`/community/${community._id}`)}
    >
      <img
        src={community?.backgroundImage?.url || Image}
        className="ls-community-img"
        alt=""
      />

      <div className="ls-community-content">
        <p className="ls-community-name">{community?.name}</p>

        <div className="ls-stats-row flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1">
            <Users size={10} /> {community?.memberCount || 0}
          </span>

          <span className="flex items-center gap-1">
            <DoorOpenIcon size={10} /> {community?.roomsLast7DaysCount || 0}
          </span>

          <button className="ls-tag-circle" onClick={() => setShowTags(true)}>
            <Tag size={10} /> {tags.length}
          </button>
        </div>
      </div>

      {showTags && (
        <div className="ls-tag-dashboard">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Tags</span>
            <button onClick={() => setShowTags(false)}>
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <span
                key={i}
                className="bg-white/25 px-2 py-1 rounded-md text-[10px]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Room Row ---------- */
const RoomSidebarItem = ({ room }) => {
  return (
    <div className="ls-room-row">
      <span className="ls-room-name"># {room?.name}</span>
    </div>
  );
};

/* ---------- Section Wrapper ---------- */
const SidebarSection = ({ title, items, renderItem }) => {
  const [expanded, setExpanded] = useState(false);

  const safeItems = Array.isArray(items) ? items : [];
  const hasMore = safeItems.length > 3;
  const visible = expanded ? safeItems : safeItems.slice(0, 3);

  return (
    <div className="ls-card">
      <div className="ls-card-header">
        <h3 className="ls-card-title">{title}</h3>

        {hasMore && (
          <button className="ls-more" onClick={() => setExpanded((p) => !p)}>
            {expanded ? "Hide" : "Show"}
          </button>
        )}
      </div>

      <div className="ls-card-body">
        {safeItems.length === 0 && <p className="ls-empty">Currently empty</p>}

        {safeItems.length > 0 && (
          <ul className="ls-list">
            {visible.map((item) => (
              <li key={item._id}>{renderItem(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/* ---------- LEFT SIDEBAR MAIN ---------- */
const LeftSidebar = () => {
  const dispatch = useDispatch();
  const { my, suggested, rooms } = useSelector((s) => s.community);

  const [sortedMy, setSortedMy] = useState([]);
  const [sortedSuggested, setSortedSuggested] = useState([]);

  /* ---------- Sync order from Redux ---------- */
  useEffect(() => {
    if (Array.isArray(my)) {
      setSortedMy([...my]);
    }
  }, [my]);

  /* ---------- Suggested: sort by popularity ---------- */
  useEffect(() => {
    if (Array.isArray(suggested)) {
      setSortedSuggested(
        [...suggested].sort(
          (a, b) => (b.memberCount || 0) - (a.memberCount || 0)
        )
      );
    }
  }, [suggested]);

  return (
    <aside className="leftsidebar">
      <div className="ls-inner">
        <SidebarSection
          title="My Rooms"
          items={rooms}
          renderItem={(r) => <RoomSidebarItem room={r} />}
        />
        <SidebarSection
          title="My Communities"
          items={sortedMy}
          renderItem={(c) => <CommunitySidebarItem community={c} />}
        />

        <SidebarSection
          title="Suggested Communities"
          items={sortedSuggested}
          renderItem={(c) => <CommunitySidebarItem community={c} />}
        />
      </div>
    </aside>
  );
};

export default LeftSidebar;
