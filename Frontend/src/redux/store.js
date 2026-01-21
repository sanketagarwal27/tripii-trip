import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import authSlice from "./authslice.js";
import postSlice from "./postSlice.js";
import communitySlice from "./communitySlice.js";
import chatbotSlice from "./chatbotSlice.js";
import socketSlice from "./socketSlice.js";
import roomSlice from "./roomSlice.js";
import tripSlice from "./tripSlice.js";
import uploadSlice from "./uploadSlice.js";
import walletSlice from "./tripWalletSlice.js";
import adminSlice from "./adminSlice.js";

const rootReducer = combineReducers({
  auth: authSlice,
  post: postSlice,
  community: communitySlice,
  chatbot: chatbotSlice,
  socket: socketSlice,
  room: roomSlice,
  trip: tripSlice,
  upload: uploadSlice,
  wallet: walletSlice,
  admin: adminSlice,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "community"], //isme jo bhi slices rehta hai wo refresh pe apna data loose nahi krta
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for persist
    }),
});

export const persistor = persistStore(store);
