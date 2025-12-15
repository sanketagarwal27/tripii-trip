import { useState, useCallback } from "react";
import { getMessageComments } from "@/api/community";

export default function useMessageComments(messageId) {
  const [comments, setComments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!messageId || loading) return;

    setLoading(true);
    try {
      const res = await getMessageComments(messageId, { before: cursor });
      setComments((prev) => [...prev, ...res.data.data.comments]);
      setCursor(res.data.data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [messageId, cursor, loading]);

  return { comments, load, loading };
}
