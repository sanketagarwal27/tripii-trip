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
  pinCommunityMessage,
  unpinCommunityMessage,
  addMembersToCommunity,
  updateMemberRole,
  removeMemberFromCommunity,
} from "@/redux/communitySlice";
import { updateRoomMembers } from "@/redux/roomSlice.js";
import { EVENTS } from "./events.js";
import {
  addTripPhoto,
  addTripPhotos,
  addTripPlan,
  removeTripPhoto,
  removeTripPlan,
  reorderTripPlansOptimistic,
  updateTripPhotoVisibility,
  updateTripPlan,
} from "@/redux/tripSlice.js";
import {
  addWalletExpense,
  removeWalletExpense,
  setSettlements,
  updateSettlement,
  updateWalletExpense,
  updateWalletSettings,
} from "@/redux/tripWalletSlice.js";

const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);
  const selectedCommunity = useSelector((s) => s.community.selectedCommunity);
  const communityProfile = useSelector((s) => s.community.profile);
  const activeTripId = useSelector((s) => s.trip.activeTripId);
  const galleryLoaded = useSelector((s) => !!s.trip.tripPhotos[activeTripId]);

  // -----------------------
  // SYNC ON FOCUS
  // -----------------------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && socket.connected) {
        socket.emit("sync:request");
      }
    };

    const handleFocus = () => {
      if (socket.connected) {
        socket.emit("sync:request");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // -----------------------
  // TRIP ROOM JOIN / LEAVE
  // -----------------------
  useEffect(() => {
    if (!user || !activeTripId || !socket.connected) return;

    socket.emit(EVENTS.TRIP_JOIN, activeTripId);

    return () => {
      socket.emit(EVENTS.TRIP_LEAVE, activeTripId);
    };
  }, [user, activeTripId]);

  // -----------------------
  // SOCKET CONNECTION & EVENTS
  // -----------------------
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
      } catch (e) {
        console.error("Failed to identify user:", e);
      }
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
        payload.community?._id || payload.community,
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

    socket.on("community:message:pinned", (payload) => {
      dispatch(pinCommunityMessage(payload));
    });

    socket.on("community:message:unpinned", ({ messageId }) => {
      dispatch(unpinCommunityMessage(messageId));
    });

    socket.on("community:updated", (data) => {
      if (data?.communityId && selectedCommunity?._id === data.communityId) {
        dispatch(
          setCommunityProfile({
            ...selectedCommunity,
            ...data,
          }),
        );
      }

      dispatch(
        addCommunityActivity({
          type: "settings_updated",
          payload: data,
          createdAt: new Date().toISOString(),
        }),
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

    socket.on(
      "community:message:commentCount",
      ({ messageId, commentCount }) => {
        dispatch(
          updateCommunityMessage({
            _id: messageId,
            commentCount,
          }),
        );
      },
    );

    socket.on(
      "community:message:helpful",
      ({ messageId, helpfulCount, helpful }) => {
        dispatch(
          updateCommunityMessage({
            _id: messageId,
            helpful,
            helpfulCount,
          }),
        );
      },
    );

    // -----------------------
    // ROOM EVENTS - 🔥 FIXED
    // -----------------------
    socket.on(
      "room:userJoined",
      ({ roomId, user: joinedUser, role, joinedAt }) => {
        // Add activity
        dispatch(
          addCommunityActivity({
            type: "room_user_joined",
            payload: { roomId, joinedUser },
            createdAt: new Date().toISOString(),
          }),
        );

        // Add notification
        dispatch(
          addNotification({
            type: "room:userJoined",
            payload: { roomId, user: joinedUser },
          }),
        );

        // 🔥 FIX: Update community rooms list
        dispatch(
          updateCommunityRoom({
            _id: roomId,
            $addMember: {
              user: joinedUser,
              role: role || "member",
              joinedAt: joinedAt || new Date().toISOString(),
            },
          }),
        );

        // Update selected room (if viewing it)
        dispatch(
          updateRoomMembers({
            user: joinedUser,
            role: role || "member",
            joinedAt: joinedAt || new Date(),
          }),
        );
      },
    );

    socket.on("room:created", (data) => {
      const { room, trip, activity } = data;

      if (room) {
        dispatch(addCommunityRoom(room));
      }

      if (activity) {
        dispatch(addCommunityActivity(activity));
      } else {
        dispatch(
          addCommunityActivity({
            type: room?.roomtype === "Trip" ? "trip_created" : "room_created",
            payload: data,
            createdAt: new Date().toISOString(),
          }),
        );
      }

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

    // -----------------------
    // COMMUNITY SETTINGS
    // -----------------------
    socket.on("member:bulk_added", ({ members }) => {
      dispatch(addMembersToCommunity(members));
    });

    socket.on("role:updated", ({ userId, role }) => {
      dispatch(updateMemberRole({ userId, role }));
    });

    socket.on("member:removed", ({ userId }) => {
      dispatch(removeMemberFromCommunity(userId));
    });

    // -----------------------
    // TRIP / ITINERARY EVENTS
    // -----------------------

    socket.on(EVENTS.ITINERARY_CREATED, ({ plan }) => {
      // ✅ Ignore own creations (already added via API response)
      if (plan.createdBy?._id === user?._id) return;
      dispatch(addTripPlan(plan));
    });

    socket.on(EVENTS.ITINERARY_UPDATED, ({ plan }) => {
      dispatch(updateTripPlan(plan));
    });

    socket.on(EVENTS.ITINERARY_DELETED, ({ planId }) => {
      if (!activeTripId) return;

      dispatch(
        removeTripPlan({
          tripId: activeTripId,
          planId,
        }),
      );
    });

    socket.on(EVENTS.ITINERARY_REORDERED, ({ date, orderedPlanIds }) => {
      if (!activeTripId) return;

      dispatch(
        reorderTripPlansOptimistic({
          tripId: activeTripId,
          date,
          orderedPlanIds,
        }),
      );
    });

    socket.on(EVENTS.ITINERARY_AI_ADDED, ({ plans }) => {
      plans.forEach((plan) => {
        dispatch(addTripPlan(plan));
      });
    });

    // -----------------------
    // TRIP / GALLERY EVENTS
    // -----------------------

    socket.on(EVENTS.TRIP_PHOTO_UPLOADED, ({ photo, photos }) => {
      if (!activeTripId || !galleryLoaded) return;

      const uploaderId = photo?.uploadedBy?._id || photos?.[0]?.uploadedBy?._id;
      if (uploaderId === user?._id) return;

      dispatch(
        addTripPhotos({
          tripId: activeTripId,
          photos: photos ?? [photo],
        }),
      );
    });

    socket.on(EVENTS.TRIP_PHOTO_PUSHED, ({ photos }) => {
      if (!activeTripId || !Array.isArray(photos)) return;

      dispatch(
        addTripPhotos({
          tripId: activeTripId,
          photos,
        }),
      );
    });

    socket.on(EVENTS.TRIP_PHOTO_DELETED, ({ tripId, photoId }) => {
      if (!tripId) return;

      dispatch(
        removeTripPhoto({
          tripId,
          photoId,
        }),
      );
    });

    // -----------------------
    // TRIP / WALLET EVENTS
    // -----------------------

    socket.on(EVENTS.WALLET_EXPENSE_ADDED, ({ tripId, expense }) => {
      if (!tripId || tripId !== activeTripId) return;

      dispatch(addWalletExpense({ tripId, expense }));
    });

    socket.on(EVENTS.WALLET_EXPENSE_UPDATED, ({ tripId, expense }) => {
      if (tripId !== activeTripId) return;

      dispatch(
        updateWalletExpense({
          tripId,
          expense,
        }),
      );
    });

    socket.on(EVENTS.WALLET_EXPENSE_DELETED, ({ tripId, expenseId }) => {
      if (!tripId) return;

      dispatch(
        removeWalletExpense({
          tripId,
          expenseId,
        }),
      );
    });

    socket.on(
      EVENTS.WALLET_SETTINGS_UPDATED,
      ({ tripId, settings, budget }) => {
        if (!tripId) return;

        dispatch(
          updateWalletSettings({
            tripId,
            settings,
            budget,
          }),
        );
      },
    );

    socket.on(EVENTS.WALLET_SETTLEMENT_GENERATED, ({ tripId, settlements }) => {
      if (!tripId) return;

      dispatch(
        setSettlements({
          tripId,
          settlements,
        }),
      );
    });

    socket.on(
      EVENTS.WALLET_SETTLEMENT_UPDATED,
      ({ tripId, index, settlement }) => {
        if (!tripId) return;

        dispatch(
          updateSettlement({
            tripId,
            index,
            settlement,
          }),
        );
      },
    );

    // -----------------------
    // CLEANUP
    // -----------------------
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

      socket.off("member:bulk_added");
      socket.off("role:updated");
      socket.off("member:removed");

      socket.off(EVENTS.ITINERARY_CREATED);
      socket.off(EVENTS.ITINERARY_UPDATED);
      socket.off(EVENTS.ITINERARY_DELETED);
      socket.off(EVENTS.ITINERARY_REORDERED);
      socket.off(EVENTS.ITINERARY_AI_ADDED);
      socket.off(EVENTS.TRIP_PHOTO_UPLOADED);
      socket.off(EVENTS.TRIP_PHOTO_PUSHED);
      socket.off(EVENTS.TRIP_PHOTO_DELETED);

      // Wallet
      socket.off(EVENTS.WALLET_EXPENSE_ADDED);
      socket.off(EVENTS.WALLET_EXPENSE_UPDATED);
      socket.off(EVENTS.WALLET_EXPENSE_DELETED);
      socket.off(EVENTS.WALLET_SETTINGS_UPDATED);
      socket.off(EVENTS.WALLET_SETTLEMENT_GENERATED);
      socket.off(EVENTS.WALLET_SETTLEMENT_UPDATED);
    };
  }, [
    user,
    dispatch,
    selectedCommunity,
    communityProfile,
    activeTripId,
    galleryLoaded,
  ]);

  return <>{children}</>;
};

export default SocketProvider;
