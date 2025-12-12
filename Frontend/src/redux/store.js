import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import authSlice from "./authslice.js";
import postSlice from "./postSlice.js";
import communitySlice from "./communitySlice.jsx";
import chatbotReducer from "./chatbotSlice.js"; 

const rootReducer = combineReducers({
  auth: authSlice,
  post: postSlice,
  community: communitySlice,
  chatbot: chatbotReducer, 
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
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