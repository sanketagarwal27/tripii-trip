import { useMemo, useRef, useState, useEffect } from "react";
import { CalendarDays, Plane, Link2, UserPlus } from "lucide-react";
import AddExternalLink from "./AddExternalLinks";
import { useSelector } from "react-redux";
import { GiRamProfile } from "react-icons/gi";
import AddMembers from "./AddMembers";
import { useNavigate } from "react-router-dom";

export default function RoomRightSidebar({ room: fallbackRoom }) {
  const navigate = useNavigate();
  const isTrip = fallbackRoom?.roomtype === "Trip";
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);

  // 🔥 USE REDUX ROOM DATA
  const room = useSelector((s) => s.room.selectedRoomData) || fallbackRoom;
  const { user } = useSelector((s) => s.auth);

  if (!room) return null;

  const myMembership = room?.members?.find((m) => m.user?._id === user?._id);

  const canManageRoom =
    myMembership && ["owner", "moderator"].includes(myMembership.role);

  const dateRange = useMemo(() => {
    if (!room.startDate || !room.endDate) return null;
    return `${new Date(room.startDate).toDateString()} → ${new Date(
      room.endDate
    ).toDateString()}`;
  }, [room.startDate, room.endDate]);

  const currentUserId = user?._id;

  const sortedMembers = useMemo(() => {
    if (!room?.members?.length || !currentUserId) return [];

    return [...room.members].sort((a, b) => {
      const aId = a.user?._id;
      const bId = b.user?._id;

      // 1️⃣ Me always first
      if (aId === currentUserId) return -1;
      if (bId === currentUserId) return 1;

      // 2️⃣ Owner next
      if (a.role === "owner" && b.role !== "owner") return -1;
      if (b.role === "owner" && a.role !== "owner") return 1;

      // 3️⃣ Moderators next
      if (a.role === "moderator" && b.role === "member") return -1;
      if (b.role === "moderator" && a.role === "member") return 1;

      // 4️⃣ Otherwise keep original order
      return 0;
    });
  }, [room.members, currentUserId]);

  return (
    <aside className="RoomRightSidebar">
      <div className="rrs-content">
        {/* COVER */}
        <div
          className="rrs-cover"
          style={{
            backgroundImage: `url(${room.roombackgroundImage?.url})`,
          }}
        >
          <div className="rrs-cover-overlay" />
          <span className="rrs-badge">
            {isTrip ? "Trip Room" : "Chat Room"}
          </span>
        </div>

        <h2 className="rrs-title">{room.name}</h2>

        <p className="rrs-meta">
          {room.status === "active" ? "Active now" : "Archived"}
        </p>

        <p className="rrs-meta">
          {room.roomTags?.map((tag, i) => (
            <span key={tag}>
              {tag}
              {i !== room.roomTags.length - 1 && ", "}
            </span>
          ))}
        </p>

        {room.description && <ExpandableDescription text={room.description} />}

        {dateRange && (
          <div className="rrs-meta-row">
            <CalendarDays size={14} />
            <span>{dateRange}</span>
          </div>
        )}

        {/* ADD LINKS */}
        {canManageRoom ? (
          <div
            style={{
              display: "flex",
              gap: "10px",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <button
              className="rrs-Addlinks-button"
              onClick={() => setShowAddLink(true)}
            >
              + Add Links
            </button>
            <button
              className="rrs-Addlinks-button"
              onClick={() => setShowAddMembers(true)}
            >
              <UserPlus size={16} /> Add Members
            </button>
          </div>
        ) : (
          ""
        )}

        {/* ACTION BUTTONS */}
        <div className="rrs-actions">
          {room.linkedTrip && (
            <button
              className="rrs-btn"
              onClick={() => navigate(`/trips/trip/${room.linkedTrip}`)}
              style={{ backgroundColor: "orange" }}
            >
              <Plane size={16} /> Trip
            </button>
          )}

          {room.externalLinks?.map((l) => (
            <a
              key={l?._id || l?.name}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="rrs-btn"
              style={{
                fontSize: "12px",
                display: "flex",
                flexWrap: "nowrap",
                padding: "5px 5px",
              }}
            >
              <Link2 size={16} />
              {l.name}
            </a>
          ))}
        </div>

        {/* MEMBERS */}
        <div className="rrs-section">
          <div className="rrs-section-header">
            <h3>Travelers</h3>
            <span>{room.members.length}</span>
          </div>

          <div className="rrs-members">
            {sortedMembers.map((m) => (
              <div key={m?.user?._id} className="rrs-member">
                <img
                  src={m?.user?.profilePicture?.url || "/avatar.png"}
                  alt=""
                />
                <div>
                  <p>{m?.user?.username}</p>
                  <span>{m.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddLink && (
        <AddExternalLink
          roomId={room?._id}
          onClose={() => setShowAddLink(false)}
        />
      )}
      {showAddMembers && (
        <AddMembers room={room} onClose={() => setShowAddMembers(false)} />
      )}
    </aside>
  );
}

/* -----------------------------------
   Expandable Description Component
------------------------------------ */
function ExpandableDescription({ text }) {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    // Measure full height
    el.classList.remove("clamped");
    const fullHeight = el.scrollHeight;

    // Re-apply clamp
    el.classList.add("clamped");
    const clampedHeight = el.clientHeight;

    setOverflowing(fullHeight > clampedHeight);
  }, [text]);

  return (
    <div className="rrs-desc-wrapper">
      <p ref={ref} className={`rrs-desc ${expanded ? "expanded" : "clamped"}`}>
        {text}
      </p>

      {overflowing && (
        <button
          className="rrs-show-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "... Show more"}
        </button>
      )}
    </div>
  );
}
