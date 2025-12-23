// src/providers/SocketProvider.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket, connectSocket, disconnectSocket } from "../../Socket.js";
import {
  setSocketConnected,
  addNotification,
  setPresence,
} from "@/redux/socketSlice";
import {
  addCommunityMessage,
  updateCommunityMessage,
  removeCommunityMessage,
  addCommunityActivity,
  setCommunityProfile,
  moveCommunityToTop,
  addCommunityRoom,
  updateCommunityRoom,
} from "@/redux/communitySlice";
import { updateRoomMembers } from "@/redux/roomSlice.js";

const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);
  const selectedCommunity = useSelector((s) => s.community.selectedCommunity);
  const communityProfile = useSelector((s) => s.community.profile);

  useEffect(() => {
    const onFocus = () => {
      if (socket.connected) {
        socket.emit("sync:request");
      }
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        onFocus();
      }
    });

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      dispatch(setSocketConnected(false));
      return;
    }

    connectSocket();

    socket.on("connect", () => {
      dispatch(setSocketConnected(true));
      try {
        socket.emit("identify", { userId: user._id });
      } catch (e) {}
    });

    socket.on("disconnect", () => {
      dispatch(setSocketConnected(false));
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err);
    });

    // -----------------------
    // COMMUNITY EVENTS
    // -----------------------
    socket.on("community:message:new", (payload) => {
      const payloadCommunityId = String(
        payload.community?._id || payload.community
      );

      dispatch(addCommunityMessage(payload));
      dispatch(moveCommunityToTop(payloadCommunityId));
    });

    socket.on("community:message:updated", (payload) => {
      dispatch(updateCommunityMessage(payload));
    });

    socket.on("community:message:deleted", ({ messageId }) => {
      dispatch(removeCommunityMessage(messageId));
    });

    socket.on("community:message:reaction", ({ messageId, reactions }) => {
      dispatch(updateCommunityMessage({ _id: messageId, reactions }));
    });

    socket.on("community:poll:updated", ({ messageId, poll }) => {
      dispatch(updateCommunityMessage({ _id: messageId, poll }));
    });

    socket.on("community:message:pinned", ({ messageId, pinnedBy }) => {
      if (communityProfile && communityProfile._id === selectedCommunity?._id) {
        const updatedPinnedMessages = [
          ...(communityProfile.pinnedMessages || []),
        ];

        const alreadyPinned = updatedPinnedMessages.some((p) => {
          const pId = typeof p === "object" && p.message ? p.message : p;
          const currentId = typeof pId === "object" && pId._id ? pId._id : pId;
          return String(currentId) === String(messageId);
        });

        if (!alreadyPinned) {
          updatedPinnedMessages.push({
            message: messageId,
            pinnedBy: pinnedBy,
            pinnedAt: new Date().toISOString(),
          });

          dispatch(
            setCommunityProfile({
              ...communityProfile,
              pinnedMessages: updatedPinnedMessages,
            })
          );
        }
      }
    });

    socket.on("community:message:unpinned", ({ messageId }) => {
      if (communityProfile && communityProfile._id === selectedCommunity?._id) {
        const updatedPinnedMessages = (
          communityProfile.pinnedMessages || []
        ).filter((p) => {
          const pId = typeof p === "object" && p.message ? p.message : p;
          const currentId = typeof pId === "object" && pId._id ? pId._id : pId;
          return String(currentId) !== String(messageId);
        });

        dispatch(
          setCommunityProfile({
            ...communityProfile,
            pinnedMessages: updatedPinnedMessages,
          })
        );
      }
    });

    socket.on("community:updated", (data) => {
      if (data?.communityId && selectedCommunity?._id === data.communityId) {
        dispatch(
          setCommunityProfile({
            ...selectedCommunity,
            ...data,
          })
        );
      }

      dispatch(
        addCommunityActivity({
          type: "settings_updated",
          payload: data,
          createdAt: new Date().toISOString(),
        })
      );
    });

    socket.on("community:created", (payload) => {
      dispatch(addNotification({ type: "community:created", payload }));
    });

    socket.on("community:deleted", ({ communityId }) => {
      dispatch(addNotification({ type: "community:deleted", communityId }));
    });

    socket.on("community:seen", ({ communityId }) => {
      // optional: mark community notifications as seen
    });

    // -----------------------
    // COMMUNITY COMMENTS
    // -----------------------
    socket.on(
      "community:message:commentCount",
      ({ messageId, commentCount }) => {
        dispatch(
          updateCommunityMessage({
            _id: messageId,
            commentCount,
          })
        );
      }
    );

    // -----------------------
    // MESSAGE HELPFUL
    // -----------------------
    socket.on("community:message:helpful", ({ messageId, helpfulCount }) => {
      dispatch(
        updateCommunityMessage({
          _id: messageId,
          helpfulCount,
        })
      );
    });

    // -----------------------
    // ROOM EVENTS - 🔥 KEY CHANGES HERE
    // -----------------------
    socket.on("room:userJoined", ({ roomId, user: joinedUser }) => {
      dispatch(
        addCommunityActivity({
          type: "room_user_joined",
          payload: { roomId, joinedUser },
          createdAt: new Date().toISOString(),
        })
      );
      dispatch(
        addNotification({
          type: "room:userJoined",
          payload: { roomId, user: joinedUser },
        })
      );

      // Update the room's member list
      dispatch(
        updateRoomMembers({
          user: joinedUser,
          role: "member",
          joinedAt: new Date(),
        })
      );
    });

    // 🔥 CRITICAL: Handle room:created event
    socket.on("room:created", (data) => {
      console.log("Room created event received:", data);
      const { room, trip, activity } = data;

      // Add room to Redux store (will appear in RightSidebar and RoomsTab)
      if (room) {
        dispatch(addCommunityRoom(room));
      }

      // Add activity
      if (activity) {
        dispatch(addCommunityActivity(activity));
      } else {
        dispatch(
          addCommunityActivity({
            type: "room_created",
            payload: data,
            createdAt: new Date().toISOString(),
          })
        );
      }

      // Add notification
      dispatch(addNotification({ type: "room:created", payload: data }));
    });

    // -----------------------
    // NOTIFICATIONS / USER EVENTS
    // -----------------------
    socket.on("notification:new", (notif) => {
      dispatch(addNotification(notif));
    });

    socket.on("presence:update", (p) => {
      dispatch(setPresence(p));
    });

    // -----------------------
    // SYNC RESPONSE
    // -----------------------
    socket.on("sync:community:messages", ({ messages }) => {
      if (messages && messages.length > 0) {
        messages.forEach((msg) => {
          dispatch(addCommunityMessage(msg));
        });
      }
    });

    // cleanup on unmount or user change
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");

      socket.off("community:message:new");
      socket.off("community:message:updated");
      socket.off("community:message:deleted");
      socket.off("community:message:reaction");
      socket.off("community:poll:updated");
      socket.off("community:message:pinned");
      socket.off("community:message:unpinned");

      socket.off("community:message:commentCount");
      socket.off("community:message:helpful");
      socket.off("community:updated");
      socket.off("community:created");
      socket.off("community:deleted");

      socket.off("room:userJoined");
      socket.off("room:created");

      socket.off("notification:new");
      socket.off("presence:update");

      socket.off("sync:community:messages");
    };
  }, [user, dispatch, selectedCommunity, communityProfile]);

  return <>{children}</>;
};

export default SocketProvider;
