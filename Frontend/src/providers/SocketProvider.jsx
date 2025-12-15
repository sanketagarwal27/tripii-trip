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
  addCommentToMessage,
  updateComment,
  removeComment,
} from "@/redux/communitySlice";

// Also import room-related reducers if you keep a separate rooms/messages slice.
// For now we will handle community and room messages via communitySlice for community page,
// and we will dispatch generic notifications for other events.

const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);
  const selectedCommunity = useSelector((s) => s.community.selectedCommunity);

  useEffect(() => {
    // connect only when user is available
    if (!user) {
      // ensure disconnected
      disconnectSocket();
      dispatch(setSocketConnected(false));
      return;
    }

    // connect
    connectSocket();

    // basic connection events
    socket.on("connect", () => {
      dispatch(setSocketConnected(true));
      // optional: tell server who I am (if server expects explicit auth)
      try {
        // If server expects a "join-user" or such, you can emit here
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

      const activeCommunityId = String(selectedCommunity?._id || "");

      // 🔥 ALWAYS add message to Redux store
      dispatch(addCommunityMessage(payload));

      // Move community to top in sidebar
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
      dispatch(
        updateCommunityMessage({
          _id: messageId,
          pinnedMessage: { message: messageId, pinnedBy },
        })
      );
    });

    socket.on("community:message:unpinned", ({ messageId }) => {
      // remove pinnedMessage property if exists
      dispatch(updateCommunityMessage({ _id: messageId, pinnedMessage: null }));
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
      // do nothing for now, but KEEP THIS EVENT
    });

    // -----------------------
    // COMMUNITY COMMENTS
    // -----------------------

    // ---------------- COMMENTS ----------------
    socket.on("community:comment:new", ({ comment }) => {
      console.log("🔥 SOCKET: New comment received", comment);
      dispatch(
        addCommentToMessage({
          messageId: comment.message,
          comment,
        })
      );
    });

    socket.on("community:comment:reaction", ({ commentId, reactions }) => {
      console.log("🔥 SOCKET: New reaction received", reactions);
      dispatch(
        updateComment({
          commentId,
          data: { reactions },
        })
      );
    });

    // socket.on("community:comment:helpful", ({ commentId, helpfulCount }) => {
    //   dispatch(
    //     updateComment({
    //       commentId,
    //       data: { helpfulCount },
    //     })
    //   );
    // });

    socket.on("community:comment:deleted", ({ commentId, messageId }) => {
      dispatch(removeComment({ commentId, messageId }));
    });

    // ---------------- COMMENT COUNT ----------------
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
      // 🔥 This updates ANY message with this ID across all communities
      dispatch(
        updateCommunityMessage({
          _id: messageId,
          helpfulCount,
        })
      );
    });

    // -----------------------
    // ROOM EVENTS
    // -----------------------
    socket.on("room:newMessage", (msg) => {
      // For simplicity, if the message belongs to the currently-open community, add to messages.
      // Ideally you have a room slice; adapt as needed.
      dispatch(addCommunityMessage(msg));
    });

    socket.on("room:messageDeleted", ({ messageId }) => {
      dispatch(removeCommunityMessage(messageId));
    });

    socket.on("room:reactionUpdated", ({ messageId, reactions }) => {
      dispatch(updateCommunityMessage({ _id: messageId, reactions }));
    });

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
    });

    socket.on("room:created", (data) => {
      dispatch(
        addCommunityActivity({
          type: "room_created",
          payload: data,
          createdAt: new Date().toISOString(),
        })
      );
      dispatch(addNotification({ type: "room:created", payload: data }));
    });

    // -----------------------
    // NOTIFICATIONS / USER EVENTS
    // -----------------------
    socket.on("notification:new", (notif) => {
      dispatch(addNotification(notif));
    });

    socket.on("presence:update", (p) => {
      // p = { userId, online, lastSeen }
      dispatch(setPresence(p));
    });

    // cleanup on unmount or user change
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");

      // socket.off("community:message:new");
      socket.off("community:message:updated");
      socket.off("community:message:deleted");
      socket.off("community:message:reaction");
      socket.off("community:poll:updated");
      socket.off("community:message:pinned");
      socket.off("community:message:unpinned");
      socket.off("community:comment:new");
      socket.off("community:comment:reaction");
      socket.off("community:comment:deleted");
      socket.off("community:message:commentCount");
      socket.off("community:message:helpful");
      socket.off("community:updated");
      socket.off("community:created");
      socket.off("community:deleted");

      socket.off("room:newMessage");
      socket.off("room:messageDeleted");
      socket.off("room:reactionUpdated");
      socket.off("room:userJoined");
      socket.off("room:created");

      socket.off("notification:new");
      socket.off("presence:update");

      // Don't disconnect the socket here if you want global persistence across route changes.
      // If you do want to disconnect when user logs out, handle that in auth logic.
    };
  }, [user, dispatch, selectedCommunity]);

  return <>{children}</>;
};

export default SocketProvider;
