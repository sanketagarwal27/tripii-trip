import { ACTIVITY_CONFIG } from "../common/activityConfig";

const ActivityItem = ({ a, isLast }) => {
  const cfg = ACTIVITY_CONFIG[a.type] || {
    label: a.type,
    emoji: "❓",
    color: "bg-gray-400",
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")} • ${d.getDate()} ${d.toLocaleDateString("en-US", {
      month: "short",
    })} ${d.getFullYear()}`;
  };

  return (
    <div className="relative flex gap-3">
      {/* TIMELINE COLUMN */}
      <div className="relative flex flex-col items-center">
        {/* LINE */}
        {!isLast && (
          <div
            className={`absolute top-[14px] w-[3px] h-full ${cfg.color}`}
            style={{
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
        )}

        {/* ICON */}
        <div
          className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm ${cfg.color}`}
        >
          {cfg.emoji}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col pb-1">
        <p className="text-sm font-semibold">{cfg.label}</p>
        <p className="text-xs text-text-muted-light">
          {a.actor?.username || "Someone"} • {formatDateTime(a.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;
