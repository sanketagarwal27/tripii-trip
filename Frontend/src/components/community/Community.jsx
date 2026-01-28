// src/components/community/Community.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../../../Socket.js";

import CommunityHeader from "./CommunityHeader.jsx";
import CommunityTabs from "./CommunityTabs.jsx";
import RightSidebar from "./RightSidebar.jsx";
import useCommunityProfile from "@/hooks/useCommunityProfile";
import { getCommunityMessages } from "@/api/community.js";
import { appendCommunityMessages } from "@/redux/communitySlice.js";

export default function Community() {
  const { id } = useParams();
  const { loading } = useCommunityProfile(id);
  const { profile, selectedCommunity } = useSelector((s) => s.community);
  const dispatch = useDispatch();

  const [showAboutModal, setShowAboutModal] = useState(false);

  // Refetch messages for polling fallback
  const refetchLatest = async () => {
    if (!id) return;
    try {
      const res = await getCommunityMessages(id, { page: 1, limit: 50 });
      const latestMessages = res.data.data.messages || [];
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
    return (
      <center
        className="p-6"
        style={{ fontSize: "40px", fontWeight: "600", marginTop: "100px" }}
      >
        Loading <p>{selectedCommunity?.name || "Community"}...</p>
      </center>
    );
  }

  return (
    <main
      className="layout-container"
      style={{
        marginLeft: "18.5vw",
        marginTop: "80px",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: "100%", overflowX: "hidden", width: "100%" }}>
        <CommunityHeader profile={profile} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <CommunityTabs
              profile={profile}
              showAboutModal={showAboutModal}
              setShowAboutModal={setShowAboutModal}
            />
          </div>

          {/* Desktop Right Sidebar */}
          <aside className="xl:col-span-1 space-y-6 right-sidebar-desktop">
            <RightSidebar profile={profile} />
          </aside>
        </div>
      </div>

      {/* Mobile About Modal */}
      {showAboutModal && (
        <>
          <div
            className="about-modal-overlay open"
            onClick={() => setShowAboutModal(false)}
          />
          <div className="about-modal-content">
            <div className="about-modal-header">
              <h3>About Community</h3>
              <button
                className="about-modal-close"
                onClick={() => setShowAboutModal(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Removed inline style that was overriding CSS */}
            <RightSidebar profile={profile} />
          </div>
        </>
      )}
    </main>
  );
}
