import { ACTIVITY_CONFIG } from "../common/activityConfig";

const ActivityItem = ({ a }) => {
  const cfg = ACTIVITY_CONFIG[a.type] || {
    label: a.type,
    emoji: "❓",
    color: "bg-gray-400",
  };

  return (
    <div className="flex gap-3 relative">
      {/* Emoji */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm ${cfg.color}`}
      >
        {cfg.emoji}
      </div>

      {/* Content */}
      <div className="flex flex-col">
        <p className="text-sm font-medium">{cfg.label}</p>
        <p className="text-xs text-text-muted-light">
          {a.actor?.username || "Someone"} •{" "}
          {new Date(a.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;
