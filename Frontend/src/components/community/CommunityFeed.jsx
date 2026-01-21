import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import CreatePostBox from "@/components/community/CreatePostBox";
import CommunityPost from "@/components/community/CommunityPost";
import useCommunityMessages from "@/hooks/useCommunityMessages";

export default function CommunityFeed() {
  const profile = useSelector((s) => s.community.profile);

  // 🛡️ Guard: don't run hook until profile is ready
  const communityId = profile?._id;
  const { loading, loadMore, hasMore } = useCommunityMessages(communityId);

  const messages = useSelector((s) => s.community.messages || []);

  // ⚠️ TEMPORARY FILTER (remove later)
  const filteredMessages = useMemo(() => {
    if (!communityId) return [];
    return messages.filter(
      (m) => String(m.community?._id || m.community) === String(communityId)
    );
  }, [messages, communityId]);

  return (
    <div className="flex flex-col gap-2">
      <CreatePostBox />

      {loading && filteredMessages.length === 0 ? (
        <div className="text-text-muted-light">Loading posts…</div>
      ) : filteredMessages.length ? (
        filteredMessages.map((m) => <CommunityPost key={m._id} post={m} />)
      ) : (
        <div className="text-text-muted-light">
          No posts yet — start the conversation!
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={loadMore}
          className="text-sm text-primary mt-2 self-center"
        >
          Load more
        </button>
      )}
    </div>
  );
}
