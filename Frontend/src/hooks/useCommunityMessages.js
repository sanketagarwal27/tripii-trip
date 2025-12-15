// src/hooks/community/useCommunityMessages.js
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { getCommunityMessages } from "@/api/community";
import {
  appendCommunityMessages,
  setCommunityMessages,
} from "@/redux/communitySlice";

export default function useCommunityMessages(communityId, sort = "newest") {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(
    async (reset = false) => {
      if (!communityId || loading) return;

      setLoading(true);
      try {
        const res = await getCommunityMessages(communityId, {
          sort,
          before: reset ? null : cursor,
        });

        const data = res.data.data;

        if (reset) {
          dispatch(setCommunityMessages(data.messages));
        } else {
          dispatch(appendCommunityMessages(data.messages)); // later append
        }

        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } finally {
        setLoading(false);
      }
    },
    [communityId, sort, cursor]
  );

  return {
    loading,
    hasMore,
    loadMore: () => load(false),
    reload: () => load(true),
  };
}
