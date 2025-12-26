import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { DoorOpenIcon, Tag, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearRoomState } from "@/redux/roomSlice";
import Image from "../../../public/travel.jpg";

/* ---------- Community Row ---------- */
const CommunitySidebarItem = ({ community }) => {
  const [showTags, setShowTags] = useState(false);
  const navigate = useNavigate();
  const tags = Array.isArray(community?.tags) ? community.tags : [];

  return (
    <div
      className="ls-community-row"
      onClick={() => navigate(`/community/${community._id}`)}
      style={{ cursor: "pointer" }}
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

          <button
            className="ls-tag-circle"
            onClick={(e) => {
              e.stopPropagation();
              setShowTags((p) => !p);
            }}
          >
            <Tag size={10} /> {tags.length}
          </button>
        </div>
      </div>

      {showTags && (
        <div className="ls-tag-dashboard" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Tags</span>
            <button onClick={() => setShowTags(false)}>✕</button>
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
const RoomSidebarItem = ({ room, navigateTo = "room" }) => {
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isTripRoom = room.roomtype === "Trip";
  const trip = room.linkedTrip;

  const startDate = isTripRoom ? trip?.startDate : room?.startDate;
  const endDate = isTripRoom ? trip?.endDate : room?.endDate;

  const handleNavigate = () => {
    // 🔥 Critical fix: remove stale room data
    dispatch(clearRoomState());

    if (navigateTo === "community") {
      navigate(`/community/${room.parentCommunity._id}`);
    } else {
      navigate(`/community/${room.parentCommunity._id}/room/${room._id}`);
    }
  };

  return (
    <div
      className="ls-community-row"
      onClick={handleNavigate}
      style={{ cursor: "pointer", position: "relative" }}
    >
      <img
        src={room?.roombackgroundImage?.url || Image}
        className="ls-community-img"
        alt=""
      />

      <div className="ls-community-content">
        <p className="ls-community-name truncate"># {room?.name}</p>

        {/* META ROW */}
        <div className="ls-stats-row flex items-center gap-2 text-[10px]">
          <span className="truncate max-w-[80px] opacity-80">
            {room.parentCommunity?.name}
          </span>

          <span className="flex items-center gap-1">
            <Users size={10} /> {room.memberCount ?? room.members?.length ?? 0}
          </span>

          <button
            className={`ls-tag-circle ${isTripRoom ? "bg-blue-500/20" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo((p) => !p);
            }}
          >
            {isTripRoom ? "📍" : <Tag size={10} />}
          </button>
        </div>

        {(startDate || endDate) && (
          <div className="text-[9px] opacity-70 mt-[2px]">
            {startDate && new Date(startDate).toLocaleDateString()}
            {endDate && ` – ${new Date(endDate).toLocaleDateString()}`}
          </div>
        )}
      </div>

      {/* INFO POPOVER */}
      {showInfo && (
        <div className="ls-tag-dashboard" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between mb-2">
            <span className="font-semibold">
              {isTripRoom ? "Trip Info" : "Room Info"}
            </span>
            <button onClick={() => setShowInfo(false)}>✕</button>
          </div>

          {isTripRoom ? (
            <div className="space-y-1 text-[11px]">
              <div>
                <strong>{trip?.title}</strong>
              </div>
              <div>{trip?.location?.name || "Location"}</div>
              <div>
                {new Date(trip.startDate).toLocaleDateString()} –{" "}
                {new Date(trip.endDate).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <>
              <div className="text-[11px] mb-2">
                Community: {room.parentCommunity?.name}
              </div>

              {room.roomTags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {room.roomTags.map((t, i) => (
                    <span
                      key={i}
                      className="bg-white/20 px-2 py-[2px] rounded text-[9px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- Section Wrapper ---------- */
const SidebarSection = ({ title, items, renderItem, loading }) => {
  const [expanded, setExpanded] = useState(false);

  const list = Array.isArray(items) ? items : [];
  const visible = expanded ? list : list.slice(0, 3);

  return (
    <div className="ls-card">
      <div className="ls-card-header">
        <h3 className="ls-card-title">{title}</h3>
        {list.length > 3 && (
          <button className="ls-more" onClick={() => setExpanded((p) => !p)}>
            {expanded ? "Hide" : "Show"}
          </button>
        )}
      </div>

      <div className="ls-card-body">
        {loading && <p className="ls-empty">Loading…</p>}
        {!loading && list.length === 0 && (
          <p className="ls-empty">Currently empty</p>
        )}
        {!loading && list.length > 0 && (
          <ul className="ls-list">
            {visible.map((i) => (
              <li key={`${title}-${i._id}`}>{renderItem(i)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/* ---------- LEFT SIDEBAR ---------- */
const LeftSidebar = () => {
  const {
    myRooms,
    tripRooms,
    suggestedRooms,
    loading: roomsLoading,
  } = useSelector((s) => s.room);

  const { my: myCommunities, suggested } = useSelector((s) => s.community);

  const [sortedSuggestedCommunities, setSortedSuggestedCommunities] = useState(
    []
  );

  useEffect(() => {
    if (Array.isArray(suggested)) {
      setSortedSuggestedCommunities(
        [...suggested].sort(
          (a, b) => (b.memberCount || 0) - (a.memberCount || 0)
        )
      );
    }
  }, [suggested]);

  return (
    <aside className="leftsidebar">
      <div className="ls-inner">
        {/* My Rooms → open room */}
        <SidebarSection
          title="My Rooms"
          items={myRooms}
          renderItem={(r) => <RoomSidebarItem room={r} navigateTo="room" />}
          loading={roomsLoading}
        />

        {/* Suggested Trips → open community */}
        <SidebarSection
          title="Suggested Trips"
          items={tripRooms}
          renderItem={(r) => (
            <RoomSidebarItem room={r} navigateTo="community" />
          )}
          loading={roomsLoading}
        />

        {/* My Communities */}
        <SidebarSection
          title="My Communities"
          items={myCommunities}
          renderItem={(c) => <CommunitySidebarItem community={c} />}
        />

        {/* Suggested Rooms → open community */}
        <SidebarSection
          title="Suggested Rooms"
          items={suggestedRooms}
          renderItem={(r) => (
            <RoomSidebarItem room={r} navigateTo="community" />
          )}
          loading={roomsLoading}
        />

        {/* Suggested Communities */}
        <SidebarSection
          title="Suggested Communities"
          items={sortedSuggestedCommunities}
          renderItem={(c) => <CommunitySidebarItem community={c} />}
        />
      </div>
    </aside>
  );
};

export default LeftSidebar;
