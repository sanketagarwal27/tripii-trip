import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  rooms: [],
  selectedRoom: null,
  selectedRoomData: null,
  roomMessages: [],
  loading: false,
  error: null,
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setRooms: (state, action) => {
      state.rooms = action.payload;
    },
    setSelectedRoom: (state, action) => {
      state.selectedRoom = action.payload;
    },
    setSelectedRoomData: (state, action) => {
      state.selectedRoomData = action.payload;
    },

    setRoomMessages: (state, action) => {
      state.roomMessages = Array.isArray(action.payload) ? action.payload : [];
    },
    addRoomMessage: (state, action) => {
      const msg = action.payload;
      if (!state.roomMessages.some((m) => m._id === msg._id)) {
        state.roomMessages.push(msg);
      }
    },
    updateRoomMessage: (state, action) => {
      const updated = action.payload;
      const idx = state.roomMessages.findIndex((m) => m._id === updated._id);
      if (idx !== -1) {
        state.roomMessages[idx] = { ...state.roomMessages[idx], ...updated };
      }
    },
    removeRoomMessage: (state, action) => {
      const messageId = action.payload;
      state.roomMessages = state.roomMessages.filter(
        (m) => m._id !== messageId
      );
    },
    setRoomLoading: (state, action) => {
      state.loading = action.payload;
    },
    setRoomError: (state, action) => {
      state.error = action.payload;
    },
    addRoom: (state, action) => {
      const room = action.payload;
      if (!state.rooms.some((r) => r._id === room._id)) {
        state.rooms.unshift(room);
      }
    },
    updateRoom: (state, action) => {
      const updated = action.payload;
      const idx = state.rooms.findIndex((r) => r._id === updated._id);
      if (idx !== -1) {
        state.rooms[idx] = { ...state.rooms[idx], ...updated };
      }
    },
    updateRoomMembers(state, action) {
      const { user, role, joinedAt } = action.payload;

      if (!state.selectedRoomData) return;

      const exists = state.selectedRoomData.members?.some(
        (m) => m.user?._id === user._id
      );

      if (!exists) {
        state.selectedRoomData.members.push({
          user,
          role,
          joinedAt,
        });
      }
    },
    removeRoom: (state, action) => {
      const roomId = action.payload;
      state.rooms = state.rooms.filter((r) => r._id !== roomId);
    },
    clearRoomState: (state) => {
      state.selectedRoom = null;
      state.roomMessages = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setRooms,
  setSelectedRoom,
  setSelectedRoomData,
  setRoomMessages,
  addRoomMessage,
  updateRoomMessage,
  removeRoomMessage,
  setRoomLoading,
  setRoomError,
  addRoom,
  updateRoom,
  removeRoom,
  clearRoomState,
  updateRoomMembers,
} = roomSlice.actions;

export default roomSlice.reducer;
