import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { getCommunityMessages } from "@/api/community";
import {
  appendCommunityMessages,
  setCommunityMessages,
} from "@/redux/communitySlice";

export default function useCommunityMessages(communityId, sort = "newest") {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const cursorRef = useRef(null);
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);

  /* =========================
     RESET ON COMMUNITY CHANGE
     ========================= */
  useEffect(() => {
    cursorRef.current = null;
    initializedRef.current = false; // ✅ THIS WAS REQUIRED
    setHasMore(true);

    // 🔥 ALSO clear messages for new community
    dispatch(setCommunityMessages([]));
  }, [communityId, sort, dispatch]);

  /* =========================
     CORE LOAD FUNCTION
     ========================= */
  const load = useCallback(
    async (reset = false) => {
      if (!communityId) return;
      if (loadingRef.current) return;
      if (!hasMore && !reset) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        const res = await getCommunityMessages(communityId, {
          sort,
          before: reset ? null : cursorRef.current,
        });

        const data = res?.data?.data || {};
        const messages = data.messages || [];

        if (reset) {
          dispatch(setCommunityMessages(messages));
        } else {
          dispatch(appendCommunityMessages(messages));
        }

        cursorRef.current = data.nextCursor || null;
        setHasMore(Boolean(data.nextCursor));
        initializedRef.current = true;
      } catch (err) {
        console.error("Failed to load community messages:", err);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [communityId, sort, hasMore, dispatch]
  );

  /* =========================
     INITIAL LOAD (AUTO)
     ========================= */
  useEffect(() => {
    if (!communityId) return;
    load(true);
  }, [communityId, load]);

  return {
    loading,
    hasMore,
    loadMore: () => load(false),
    reload: () => load(true),
  };
}
