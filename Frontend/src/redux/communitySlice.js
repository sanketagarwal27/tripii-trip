// src/redux/communitySlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  my: [],
  suggested: [],
  selectedCommunity: null,
  profile: null,

  // 🔥 UPDATED SHAPE
  rooms: {
    communityId: null,
    data: [],
  },

  messages: [],

  // 🔥 UPDATED SHAPE
  activities: {
    communityId: null,
    data: [],
  },

  loading: false,
  error: null,
  selectedMessage: null,
};

const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    // ---------------- BASIC ----------------
    setMyCommunities: (state, action) => {
      state.my = action.payload;
    },
    setSuggestedCommunities: (state, action) => {
      state.suggested = action.payload;
    },
    setCommunitiesLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSelectedCommunity: (state, action) => {
      state.selectedCommunity = action.payload;
    },

    // ---------------- PROFILE ----------------
    setCommunityProfile: (state, action) => {
      state.profile = action.payload;
    },
    setCommunityRooms: (state, action) => {
      // NEW FORMAT: { communityId, rooms }
      if (action.payload?.communityId) {
        state.rooms = {
          communityId: action.payload.communityId,
          data: action.payload.rooms || [],
        };
        return;
      }

      // OLD FORMAT: rooms[]
      state.rooms = {
        communityId: state.profile?._id || null,
        data: Array.isArray(action.payload) ? action.payload : [],
      };
    },

    setCommunityMessages: (state, action) => {
      state.messages = Array.isArray(action.payload) ? action.payload : [];
    },
    setCommunityActivities: (state, action) => {
      // NEW FORMAT: { communityId, activities }
      if (action.payload?.communityId) {
        state.activities = {
          communityId: action.payload.communityId,
          data: action.payload.activities || [],
        };
        return;
      }

      // OLD FORMAT: activities[]
      state.activities = {
        communityId: state.profile?._id || null,
        data: Array.isArray(action.payload) ? action.payload : [],
      };
    },

    setCommunityError: (state, action) => {
      state.error = action.payload;
    },
    clearCommunityState: (state) => {
      state.profile = null;
      state.rooms = { communityId: null, data: [] };
      state.messages = [];
      state.activities = { communityId: null, data: [] };
      state.error = null;
    },

    // ---------------- ROOMS - 🔥 FIXED ACTIONS ----------------
    addCommunityRoom: (state, action) => {
      const room = action.payload;

      // Ensure rooms.data exists
      if (!state.rooms?.data) {
        state.rooms = { communityId: state.profile?._id || null, data: [] };
      }

      const exists = state.rooms.data.some((r) => r._id === room._id);
      if (!exists) {
        state.rooms.data.unshift(room);
      }
    },

    updateCommunityRoom: (state, action) => {
      const updated = action.payload;

      // Ensure rooms.data exists
      if (!state.rooms?.data) {
        state.rooms = { communityId: state.profile?._id || null, data: [] };
        return;
      }

      const idx = state.rooms.data.findIndex((r) => r._id === updated._id);

      if (idx !== -1) {
        // Handle special case for adding members
        if (updated.$addMember) {
          const currentMembers = state.rooms.data[idx].members || [];
          const memberExists = currentMembers.some(
            (m) =>
              m.user?._id?.toString() ===
              updated.$addMember.user?._id?.toString(),
          );

          if (!memberExists) {
            state.rooms.data[idx].members = [
              ...currentMembers,
              updated.$addMember,
            ];
          }
        } else {
          // Normal update
          state.rooms.data[idx] = { ...state.rooms.data[idx], ...updated };
        }
      }
    },

    removeCommunityRoom: (state, action) => {
      const roomId = action.payload;

      if (!state.rooms?.data) return;

      state.rooms.data = state.rooms.data.filter((r) => r._id !== roomId);
    },

    // ---------------- MESSAGES ----------------
    setSelectedMessage: (state, action) => {
      state.selectedMessage = action.payload;
    },

    addCommunityMessage: (state, action) => {
      const msg = action.payload;

      if (!state.messages.some((m) => m._id === msg._id)) {
        state.messages.unshift({
          ...msg,
          commentCount:
            typeof msg.commentCount === "number" ? msg.commentCount : 0,
          _fetchedAt: Date.now(),
        });
      }
    },

    updateCommunityMessage: (state, action) => {
      const updated = action.payload;
      const idx = state.messages.findIndex((m) => m._id === updated._id);

      if (idx !== -1) {
        state.messages[idx] = {
          ...state.messages[idx],
          ...updated,

          helpful: Array.isArray(updated.helpful)
            ? [...updated.helpful]
            : state.messages[idx].helpful,

          helpfulCount:
            typeof updated.helpfulCount === "number"
              ? updated.helpfulCount
              : state.messages[idx].helpfulCount,

          poll: updated.poll ? { ...updated.poll } : state.messages[idx].poll,

          reactions: updated.reactions
            ? [...updated.reactions]
            : state.messages[idx].reactions,

          commentCount:
            typeof updated.commentCount === "number"
              ? updated.commentCount
              : state.messages[idx].commentCount,
        };
      }
    },

    removeCommunityMessage: (state, action) => {
      const messageId = action.payload;
      state.messages = state.messages.filter((m) => m._id !== messageId);
    },

    // ---------------- ACTIVITIES ----------------
    addCommunityActivity: (state, action) => {
      const a = action.payload;
      if (!state.activities?.data) return;

      if (state.activities.data.some((x) => x._id === a._id)) return;

      state.activities.data.unshift(a);

      if (state.activities.data.length > 200) {
        state.activities.data = state.activities.data.slice(0, 200);
      }
    },

    // ---------------- SORTING ----------------
    moveCommunityToTop: (state, action) => {
      const communityId = action.payload;
      if (!Array.isArray(state.my)) return;

      const idx = state.my.findIndex((c) => c._id === communityId);
      if (idx === -1) return;

      const active = state.my[idx];
      const newArray = state.my.filter((c) => c._id !== communityId);
      state.my = [active, ...newArray];
    },

    appendCommunityMessages: (state, action) => {
      const incoming = action.payload;
      const existingIds = new Set(state.messages.map((m) => m._id));

      const newMessages = incoming
        .filter((msg) => !existingIds.has(msg._id))
        .map((msg) => ({
          ...msg,
          commentCount:
            typeof msg.commentCount === "number" ? msg.commentCount : 0,
          _fetchedAt: Date.now(),
        }));

      state.messages.push(...newMessages);
    },

    // ---------------- PIN / UNPIN ----------------
    pinCommunityMessage: (state, action) => {
      const { messageId, pinnedBy, pinnedAt } = action.payload;
      if (!state.profile) return;

      if (!Array.isArray(state.profile.pinnedMessages)) {
        state.profile.pinnedMessages = [];
      }

      const exists = state.profile.pinnedMessages.some(
        (p) => String(p.message) === String(messageId),
      );

      if (!exists) {
        state.profile.pinnedMessages.unshift({
          message: messageId,
          pinnedBy,
          pinnedAt,
        });
      }
    },

    unpinCommunityMessage: (state, action) => {
      const messageId = action.payload;
      if (!state.profile?.pinnedMessages) return;

      state.profile.pinnedMessages = state.profile.pinnedMessages.filter(
        (p) =>
          (p.message?._id || p.message || p).toString() !==
          messageId.toString(),
      );
    },

    addMembersToCommunity: (state, action) => {
      const newMembers = action.payload;

      const existingIds = new Set(state.profile.members.map((m) => m.user._id));

      newMembers.forEach((m) => {
        if (!existingIds.has(m.user._id)) {
          state.profile.members.push(m);
        }
      });

      state.profile.memberCount = state.profile.members.length;
    },

    updateMemberRole(state, action) {
      const { userId, role } = action.payload;
      const m = state.profile.members.find((x) => x.user._id === userId);
      if (m) m.role = role;
    },

    removeMemberFromCommunity(state, action) {
      state.profile.members = state.profile.members.filter(
        (m) => m.user._id !== action.payload,
      );
      state.profile.memberCount -= 1;
    },
  },
});

export const {
  setMyCommunities,
  setSuggestedCommunities,
  setCommunitiesLoading,
  setSelectedCommunity,
  setCommunityProfile,
  setCommunityRooms,
  setCommunityMessages,
  setCommunityActivities,
  setCommunityError,
  clearCommunityState,

  // 🔥 Export room actions
  addCommunityRoom,
  updateCommunityRoom,
  removeCommunityRoom,

  setSelectedMessage,
  addCommunityMessage,
  updateCommunityMessage,
  removeCommunityMessage,
  appendCommunityMessages,

  addCommunityActivity,
  moveCommunityToTop,

  pinCommunityMessage,
  unpinCommunityMessage,

  updateMemberRole,
  addMembersToCommunity,
  removeMemberFromCommunity,
} = communitySlice.actions;

export default communitySlice.reducer;
