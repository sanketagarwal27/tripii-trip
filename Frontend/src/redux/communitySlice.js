// src/redux/communitySlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  my: [],
  suggested: [],
  selectedCommunity: null,
  profile: null,
  rooms: [],
  messages: [],
  activities: [],
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
      state.rooms = action.payload;
    },
    setCommunityMessages: (state, action) => {
      state.messages = Array.isArray(action.payload) ? action.payload : [];
    },
    setCommunityActivities: (state, action) => {
      state.activities = Array.isArray(action.payload) ? action.payload : [];
    },
    setCommunityError: (state, action) => {
      state.error = action.payload;
    },
    clearCommunityState: (state) => {
      state.profile = null;
      state.rooms = [];
      state.messages = [];
      state.activities = [];
      state.error = null;
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
      if (state.activities.some((x) => x._id === a._id)) return;

      state.activities.unshift(a);
      if (state.activities.length > 200) {
        state.activities = state.activities.slice(0, 200);
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

  setSelectedMessage,
  addCommunityMessage,
  updateCommunityMessage,
  removeCommunityMessage,
  appendCommunityMessages,

  addCommunityActivity,
  moveCommunityToTop,
} = communitySlice.actions;

export default communitySlice.reducer;
