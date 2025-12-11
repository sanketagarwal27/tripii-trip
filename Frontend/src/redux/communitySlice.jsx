import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  my: [],
  suggested: [],
  loading: true,
};

const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    setMyCommunities: (state, action) => {
      state.my = action.payload;
    },
    setSuggestedCommunities: (state, action) => {
      state.suggested = action.payload;
    },
    setCommunitiesLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setMyCommunities,
  setSuggestedCommunities,
  setCommunitiesLoading,
} = communitySlice.actions;

export default communitySlice.reducer;
