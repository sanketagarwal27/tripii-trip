// src/redux/communitySlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  my: [],
  suggested: [],
  selectedCommunity: null,
  profile: null,
  rooms: [],
  messages: [], // messages of current community
  activities: [],
  loading: false,
  error: null,
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
    addCommunityMessage: (state, action) => {
      const msg = action.payload;

      // 🔥 Add timestamp for tracking
      const messageWithMeta = {
        ...msg,
        comments: msg.comments || [],
        _fetchedAt: Date.now(), // Track when added
      };

      if (!state.messages.some((m) => m._id === msg._id)) {
        state.messages.unshift(messageWithMeta);
      }
    },

    updateCommunityMessage: (state, action) => {
      const updated = action.payload;
      const idx = state.messages.findIndex((m) => m._id === updated._id);
      if (idx !== -1) {
        // 🔥 Deep merge for nested objects like poll
        state.messages[idx] = {
          ...state.messages[idx],
          ...updated,
          // Force new object reference for poll to trigger re-render
          poll: updated.poll ? { ...updated.poll } : state.messages[idx].poll,
        };
      }
    },

    removeCommunityMessage: (state, action) => {
      const messageId = action.payload;
      state.messages = state.messages.filter((m) => m._id !== messageId);
    },

    // ---------------- COMMENTS ----------------
    addCommentToMessage: (state, action) => {
      const { messageId, comment } = action.payload;
      const msg = state.messages.find((m) => m._id === messageId);
      if (!msg) return;

      if (!Array.isArray(msg.comments)) msg.comments = [];
      if (!msg.comments.some((c) => c._id === comment._id)) {
        msg.comments.unshift(comment);
      }
    },

    updateComment: (state, action) => {
      const { commentId, data } = action.payload;

      for (const msg of state.messages) {
        if (!Array.isArray(msg.comments)) continue;

        const idx = msg.comments.findIndex((c) => c._id === commentId);
        if (idx !== -1) {
          msg.comments[idx] = {
            ...msg.comments[idx],
            ...data,
          };
          break;
        }
      }
    },

    removeComment: (state, action) => {
      const { messageId, commentId } = action.payload;
      const msg = state.messages.find((m) => m._id === messageId);
      if (!msg || !Array.isArray(msg.comments)) return;

      msg.comments = msg.comments.filter((c) => c._id !== commentId);
    },

    // ---------------- ACTIVITIES ----------------
    addCommunityActivity: (state, action) => {
      const a = action.payload;
      if (state.activities.some((x) => x._id === a._id)) return;

      state.activities.unshift(a);
      if (state.activities.length > 200) state.activities.pop();
    },

    // ---------------- SORTING ----------------
    moveCommunityToTop: (state, action) => {
      const communityId = action.payload;
      if (!Array.isArray(state.my)) return;

      const idx = state.my.findIndex((c) => c._id === communityId);
      if (idx === -1) return;

      const active = state.my[idx];
      state.my.splice(idx, 1);
      state.my.unshift(active);
    },

    appendCommunityMessages: (state, action) => {
      const incoming = action.payload;
      const existingIds = new Set(state.messages.map((m) => m._id));

      incoming.forEach((msg) => {
        if (!existingIds.has(msg._id)) {
          state.messages.push({
            ...msg,
            _fetchedAt: Date.now(),
          });
        }
      });
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

  addCommunityMessage,
  updateCommunityMessage,
  removeCommunityMessage,
  appendCommunityMessages,

  addCommentToMessage,
  updateComment,
  removeComment,

  addCommunityActivity,
  moveCommunityToTop,
} = communitySlice.actions;

export default communitySlice.reducer;
