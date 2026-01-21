// store/slices/adminSlice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  businessListings: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setBusinessListings: (state, action) => {
      state.businessListings = action.payload;
      state.loading = false;
      state.error = null;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    updateBusinessListingStatus: (state, action) => {
      const { id, status, rejectionReason } = action.payload;
      const listing = state.businessListings.find((l) => l._id === id);
      if (listing) {
        listing.verification.status = status;
        if (rejectionReason) {
          listing.verification.rejectionReason = rejectionReason;
        }
      }
    },

    removeBusinessListing: (state, action) => {
      state.businessListings = state.businessListings.filter(
        (l) => l._id !== action.payload
      );
    },

    addBusinessListing: (state, action) => {
      state.businessListings.unshift(action.payload);
    },
  },
});

export const {
  setBusinessListings,
  setLoading,
  setError,
  updateBusinessListingStatus,
  removeBusinessListing,
  addBusinessListing,
} = adminSlice.actions;

export default adminSlice.reducer;
