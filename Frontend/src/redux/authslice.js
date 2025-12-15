// src/redux/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  suggestedUser: [],
  userProfile: null,
  selectedUser: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user || null;
      state.accessToken = accessToken || null;
      state.refreshToken = refreshToken || null;
    },

    updateUserStats: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
      }
    },

    setSuggestedUser: (state, action) => {
      state.suggestedUser = action.payload;
    },

    setUserProfile: (state, action) => {
      state.userProfile = action.payload;
    },

    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },

    logoutUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.suggestedUser = [];
      state.userProfile = null;
      state.selectedUser = null;
      localStorage.removeItem("userId");
    },
  },
});

export const {
  setAuthUser,
  updateUserStats,
  setSuggestedUser,
  setUserProfile,
  setSelectedUser,
  logoutUser,
} = authSlice.actions;

export default authSlice.reducer;
