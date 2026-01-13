// src/redux/postSlice.js
import { createSlice } from "@reduxjs/toolkit";

const postSlice = createSlice({
  name: "post",
  initialState: {
    posts: [],
    selectedPost: null,
    lastFetchedAt: null,
  },
  reducers: {
    // Accepts an array but filters out invalid posts defensively
    setPosts: (state, action) => {
      state.posts = Array.isArray(action.payload) ? action.payload : [];
      state.lastFetchedAt = Date.now();
    },

    addPost: (state, action) => {
      if (!action.payload) return;
      state.posts.unshift(action.payload);
    },

    removePost: (state, action) => {
      state.posts = state.posts.filter((p) => p._id !== action.payload);
    },

    updatePost: (state, action) => {
      const updated = action.payload;
      state.posts = state.posts.map((p) =>
        p._id === updated._id ? updated : p
      );
    },

    setSelectedPost: (state, action) => {
      state.selectedPost = action.payload;
    },
  },
});

export const {
  setPosts,
  addPost,
  removePost,
  updatePost,
  setSelectedPost,
  cleanupInvalidPosts,
} = postSlice.actions;
export default postSlice.reducer;
