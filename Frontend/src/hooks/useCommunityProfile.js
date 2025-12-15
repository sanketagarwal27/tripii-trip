// src/hooks/community/useCommunityProfile.js
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCommunityProfile,
  getCommunityRooms,
  getCommunityMessages,
  getCommunityActivities,
} from "@/api/community";
import {
  setCommunityProfile,
  setCommunityRooms,
  setCommunityMessages,
  setCommunityError,
  clearCommunityState,
  setCommunityActivities,
} from "@/redux/communitySlice";

export default function useCommunityProfile(communityId) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  // 🔥 Track which community's messages are currently loaded
  const currentMessages = useSelector((s) => s.community.messages || []);

  const load = async () => {
    try {
      setLoading(true);

      // 🔥 DON'T clear messages here - socket might have added new ones
      // Only clear profile/rooms/activities
      dispatch(setCommunityProfile(null));
      dispatch(setCommunityRooms([]));
      dispatch(setCommunityActivities([]));
      dispatch(setCommunityError(null));

      const [pRes, rRes, mRes] = await Promise.allSettled([
        getCommunityProfile(communityId),
        getCommunityRooms(communityId),
        getCommunityMessages(communityId),
      ]);

      const activityRes = await getCommunityActivities(communityId);

      /* -------------------------
         1) COMMUNITY PROFILE
      -------------------------- */
      if (pRes.status === "fulfilled") {
        const rawProfile = pRes.value?.data?.data;
        console.log("pRes:", pRes);

        const processedProfile = {
          ...rawProfile,
          isMember: !!rawProfile?.currentUserRole,
        };

        dispatch(setCommunityProfile(processedProfile));
      } else {
        dispatch(
          setCommunityError(
            pRes.reason?.response?.data?.message ||
              "Failed to fetch community profile"
          )
        );
      }

      /* -------------------------
         2) ROOMS
      -------------------------- */
      if (rRes.status === "fulfilled") {
        dispatch(setCommunityRooms(rRes.value?.data?.data?.rooms || []));
      }

      /* -------------------------
         3) MESSAGES - Smart Merge
      -------------------------- */
      if (mRes.status === "fulfilled") {
        const fetchedMessages = mRes.value?.data?.data?.messages || [];

        // 🔥 SMART MERGE: Keep socket messages that belong to this community
        const socketMessages = currentMessages.filter((msg) => {
          const msgCommunityId = String(msg.community?._id || msg.community);
          const fetchTime = msg._fetchedAt || 0;
          const isRecent = Date.now() - fetchTime < 5000; // Last 5 seconds

          return msgCommunityId === String(communityId) && isRecent;
        });

        // Merge: socket messages first (newer), then fetched messages
        const messageIds = new Set();
        const merged = [];

        // Add socket messages
        socketMessages.forEach((msg) => {
          if (!messageIds.has(msg._id)) {
            messageIds.add(msg._id);
            merged.push(msg);
          }
        });

        // Add fetched messages
        fetchedMessages.forEach((msg) => {
          if (!messageIds.has(msg._id)) {
            messageIds.add(msg._id);
            merged.push(msg);
          }
        });

        dispatch(setCommunityMessages(merged));
      }

      dispatch(setCommunityActivities(activityRes?.data?.data?.activities));
    } catch (err) {
      dispatch(setCommunityError(err?.message || "Unexpected error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (communityId) load();
  }, [communityId]);

  return { loading, reload: load };
}
