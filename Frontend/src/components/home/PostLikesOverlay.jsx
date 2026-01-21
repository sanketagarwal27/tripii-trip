import { useEffect, useRef } from "react";

const PostLikesOverlay = ({ users, hasMore, loading, onLoadMore, onClose }) => {
  const modalRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <p className="font-semibold text-sm">Likes</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-black">
            ✕
          </button>
        </div>

        {/* List */}
        <div className="max-h-[60vh] overflow-y-auto px-4 py-2 space-y-3">
          {users.map((u) => (
            <div key={u._id} className="flex items-center gap-3">
              <img
                src={u?.profilePicture?.url || "/travel.jpg"}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{u.username}</span>
                {u.likedAt && (
                  <span className="text-xs text-zinc-500">
                    {new Date(u.likedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {hasMore && (
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="w-full text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostLikesOverlay;
