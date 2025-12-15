// src/components/community/CommunityFeed.jsx
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import CreatePostBox from "@/components/community/CreatePostBox";
import CommunityPost from "@/components/community/CommunityPost";

export default function CommunityFeed() {
  const messages = useSelector((s) => s.community.messages || []);
  const profile = useSelector((s) => s.community.profile);

  // 🔥 FILTER: Only show messages from current community
  const filteredMessages = useMemo(() => {
    if (!profile?._id) return [];

    return messages.filter((m) => {
      const msgCommunityId = String(m.community?._id || m.community || "");
      return msgCommunityId === String(profile._id);
    });
  }, [messages, profile?._id]);

  return (
    <div className="flex flex-col gap-6">
      <CreatePostBox />
      {filteredMessages && filteredMessages.length ? (
        filteredMessages.map((m) => <CommunityPost key={m._id} post={m} />)
      ) : (
        <div className="text-text-muted-light">
          No posts yet — start the conversation!
        </div>
      )}
    </div>
  );
}
