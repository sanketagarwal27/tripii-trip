// src/hooks/useMessageComments.js
// 🔥 This hook is now OPTIONAL - CommComment doesn't use it anymore
// Keep it only if you want pagination support in the future

import { useState, useCallback, useRef } from "react";
import { getMessageComments } from "@/api/community";

export default function useMessageComments(messageId) {
  const [comments, setComments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const hasFetchedRef = useRef(false);
  const currentMessageIdRef = useRef(messageId);

  // Reset when messageId changes
  if (currentMessageIdRef.current !== messageId) {
    currentMessageIdRef.current = messageId;
    hasFetchedRef.current = false;
    setComments([]);
    setCursor(null);
    setHasMore(true);
  }

  const load = useCallback(
    async (force = false) => {
      if (!messageId || loading) return;
      if (hasFetchedRef.current && !force) return;
      if (!hasMore && !force) return;

      setLoading(true);
      try {
        const res = await getMessageComments(messageId, {
          before: force ? null : cursor,
        });

        const newComments = res.data.data.comments;
        const nextCursor = res.data.data.nextCursor;

        if (force) {
          setComments(newComments);
        } else {
          setComments((prev) => [...prev, ...newComments]);
        }

        setCursor(nextCursor);
        setHasMore(Boolean(nextCursor));
        hasFetchedRef.current = true;
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setLoading(false);
      }
    },
    [messageId, cursor, loading, hasMore]
  );

  const reset = useCallback(() => {
    hasFetchedRef.current = false;
    setComments([]);
    setCursor(null);
    setHasMore(true);
  }, []);

  return {
    comments,
    load,
    loading,
    hasMore,
    reset,
  };
}
