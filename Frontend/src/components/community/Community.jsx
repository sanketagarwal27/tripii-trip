// src/components/community/Community.jsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../../../Socket.js";

import CommunityHeader from "./CommunityHeader.jsx";
import CommunityTabs from "./CommunityTabs.jsx";
import RightSidebar from "./RightSidebar.jsx";
// import RoomsSidebar from "./RoomSidebar.jsx";
import useCommunityProfile from "@/hooks/useCommunityProfile";
import { getCommunityMessages } from "@/api/community.js";
import { appendCommunityMessages } from "@/redux/communitySlice.js";

export default function Community() {
  const { id } = useParams();
  const { loading } = useCommunityProfile(id);
  const profile = useSelector((s) => s.community.profile);
  const dispatch = useDispatch();

  // Refetch messages for polling fallback
  const refetchLatest = async () => {
    if (!id) return;
    try {
      const res = await getCommunityMessages(id, { page: 1, limit: 50 });
      const latestMessages = res.data.data.messages || [];

      // Only append new messages (slice already handles duplicates)
      dispatch(appendCommunityMessages(latestMessages));
    } catch (err) {
      console.error("Failed to refetch messages:", err);
    }
  };

  // Polling interval for older devices (20 seconds)
  useEffect(() => {
    if (!profile?._id) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        refetchLatest();
      }
    }, 20000);

    return () => clearInterval(intervalId);
  }, [profile?._id, id]);

  useEffect(() => {
    if (!profile?._id) return;
    socket.emit("joinCommunity", profile._id);
    console.log("I joined the new room:", profile._id);
    return () => socket.emit("leaveCommunity", profile._id);
  }, [profile?._id]);

  if (loading || !profile) {
    return <div className="p-6">Loading community...</div>;
  }

  return (
    <main className="layout-container max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      <CommunityHeader profile={profile} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* 🔥 FEED IS RENDERED VIA TABS ONLY */}
          <CommunityTabs profile={profile} />
        </div>

        <aside className="xl:col-span-1 space-y-6">
          {/* <RoomsSidebar /> */}
          <RightSidebar profile={profile} />
        </aside>
      </div>
    </main>
  );
}
