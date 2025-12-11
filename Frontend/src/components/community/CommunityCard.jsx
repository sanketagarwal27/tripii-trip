import { useState } from "react";

const CommunityCard = ({ community, onClick }) => {
  const bg = community?.backgroundImage?.url || "";
  const tags = community?.tags || [];
  const [showTags, setShowTags] = useState(false);

  return (
    <div className="community-card">
      {/* TAG GLASS BOX */}
      {showTags && (
        <div className="absolute top-0 left-0 right-0 bg-black/40 backdrop-blur-md text-white p-3 rounded-lg text-xs shadow-xl z-20 animate-fade-in">
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
                className="bg-white/20 px-2 py-1 rounded-md text-[10px]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CARD */}
      <div
        onClick={onClick}
        className="group relative bg-cover bg-center rounded-xl overflow-hidden aspect-[4/3] cursor-pointer"
        style={{
          backgroundImage: `linear-gradient(
              180deg,
              rgba(0,0,0,0.10),
              rgba(0,0,0,0.75)
            ), url('${bg}')`,
        }}
      >
        {/* TAG BADGE */}
        {tags.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTags(true);
            }}
            className="communitycard-tags absolute top-3 left-3 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-md text-[10px] font-medium"
          >
            <span className="material-symbols-outlined text-xs">label</span>
            {tags.length === 1 ? tags[0] : `${tags.length} tags`}
          </button>
        )}

        {/* CONTENT */}
        <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
          <p className="text-sm font-bold">{community.name}</p>

          <div className="flex items-center gap-4 text-[10px] opacity-90">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">group</span>
              {community.memberCount} members
            </div>

            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">
                next_week
              </span>
              {community.roomsLast7DaysCount} rooms/week
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityCard;
