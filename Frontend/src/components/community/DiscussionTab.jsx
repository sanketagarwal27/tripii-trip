import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import CreatePostBox from "@/components/community/CreatePostBox";
import CommunityPost from "@/components/community/CommunityPost";
import useCommunityMessages from "@/hooks/useCommunityMessages";

export default function DiscussionTab({ sortBy = "hot" }) {
  const profile = useSelector((s) => s.community.profile);
  const selectedCommunity = useSelector((s) => s.community.profile);

  const communityId = profile?._id;
  const { loading, loadMore, hasMore } = useCommunityMessages(communityId);

  const messages = useSelector((s) => s.community.messages || []);

  // Filter messages for current community
  const filteredMessages = useMemo(() => {
    if (!communityId) return [];
    return messages.filter(
      (m) => String(m.community?._id || m.community) === String(communityId),
    );
  }, [messages, communityId]);

  // Sort messages based on sortBy
  const sortedMessages = useMemo(() => {
    if (!filteredMessages.length) return [];

    const sorted = [...filteredMessages];

    switch (sortBy) {
      case "helpful":
        // Sort by most helpful (helpfulCount)
        return sorted.sort((a, b) => {
          const aCount = a.helpfulCount || 0;
          const bCount = b.helpfulCount || 0;
          return bCount - aCount;
        });

      case "pinned":
        // Show pinned messages first
        return sorted.sort((a, b) => {
          const pinnedMessages = selectedCommunity?.pinnedMessages || [];

          const aIsPinned = pinnedMessages.some((p) => {
            const pinnedId = typeof p === "object" && p.message ? p.message : p;
            const currentId =
              typeof pinnedId === "object" && pinnedId._id
                ? pinnedId._id
                : pinnedId;
            return String(currentId) === String(a._id);
          });

          const bIsPinned = pinnedMessages.some((p) => {
            const pinnedId = typeof p === "object" && p.message ? p.message : p;
            const currentId =
              typeof pinnedId === "object" && pinnedId._id
                ? pinnedId._id
                : pinnedId;
            return String(currentId) === String(b._id);
          });

          if (aIsPinned && !bIsPinned) return -1;
          if (!aIsPinned && bIsPinned) return 1;
          return 0;
        });

      case "comments":
        // Sort by most comments
        return sorted.sort((a, b) => {
          const aCount = a.commentCount || 0;
          const bCount = b.commentCount || 0;
          return bCount - aCount;
        });

      case "recent":
        // Sort by most recent (createdAt)
        return sorted.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

      case "hot":
      default:
        // Hot algorithm: combines helpful, comments, and recency
        return sorted.sort((a, b) => {
          const aHelpful = a.helpfulCount || 0;
          const bHelpful = b.helpfulCount || 0;
          const aComments = a.commentCount || 0;
          const bComments = b.commentCount || 0;
          const aReactions = a.reactions?.length || 0;
          const bReactions = b.reactions?.length || 0;

          // Calculate time decay (newer posts get boost)
          const now = Date.now();
          const aAge = (now - new Date(a.createdAt)) / (1000 * 60 * 60); // hours
          const bAge = (now - new Date(b.createdAt)) / (1000 * 60 * 60);

          const aTimeBoost = Math.max(0, 24 - aAge) / 24; // Boost for posts < 24hrs
          const bTimeBoost = Math.max(0, 24 - bAge) / 24;

          // Hot score formula
          const aScore =
            (aHelpful * 3 + aComments * 2 + aReactions) * (1 + aTimeBoost);
          const bScore =
            (bHelpful * 3 + bComments * 2 + bReactions) * (1 + bTimeBoost);

          return bScore - aScore;
        });
    }
  }, [filteredMessages, sortBy, selectedCommunity]);

  return (
    <div className="flex flex-col gap-2">
      <CreatePostBox />

      {loading && sortedMessages.length === 0 ? (
        <div className="text-text-muted-light">Loading posts…</div>
      ) : sortedMessages.length ? (
        sortedMessages.map((m) => <CommunityPost key={m._id} post={m} />)
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
