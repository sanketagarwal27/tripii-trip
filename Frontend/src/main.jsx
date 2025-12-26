// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider, useSelector } from "react-redux";
import { store, persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./index.css";

// Layouts
import AppLayout from "./shared/AppLayout";
import MiniAppLayout from "./shared/MiniAppLayout";
import MiniCommunityLayout from "./shared/MiniCommunityLayout";
import MiniSundayLayout from "./shared/MiniSundayLayout";

// Pages
import AuthPage from "@/pages/auth/AuthPage";
import HomePage from "@/pages/auth/HomePage";
import CommentPage from "@/components/home/CommentPage";
import CommunityHub from "./components/community/CommunityHub";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Community from "./components/community/Community";
import SocketProvider from "./providers/SocketProvider";
import CommComment from "./components/community/comments/CommComment";
import Places from "./pages/places/Places";
import Chatbot from "./pages/chatbot/Chatbot";
import CreateRoom from "./components/community/rooms/CreateRoom";
import Room from "./components/community/rooms/Room";
import ProfilePage from "./pages/profile/Profile";

// Auth Logic
function RequireAuth({ children }) {
  const user = useSelector((s) => s.auth.user);
  return user ? children : <Navigate to="/auth" replace />;
}

function NoAuth({ children }) {
  const user = useSelector((s) => s.auth.user);
  return user ? <Navigate to="/" replace /> : children;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route
          path="/auth"
          element={
            <NoAuth>
              <AuthPage />
            </NoAuth>
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {/* Home + Post Layout */}
          <Route element={<MiniAppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:id" element={<CommentPage />} />
          </Route>

          {/* Community Hub Layout */}
          <Route element={<MiniCommunityLayout />}>
            <Route path="/communities" element={<CommunityHub />} />
            <Route path="/community/:id" element={<Community />} />
            <Route
              path="/community/:communityId/message/:messageId/comments"
              element={<CommComment />}
            />
            <Route
              path="/community/:communityId/createRoom"
              element={<CreateRoom />}
            />
            <Route
              path="/community/:communityId/room/:roomId"
              element={<Room />}
            />
          </Route>

          {/* Sunday AI layout */}
          <Route element={<MiniSundayLayout />}>
            <Route path="/chatbot" element={<Chatbot />} />
          </Route>

          <Route path="/places" element={<Places />} />
          <Route path="/profile/:id" element={<ProfilePage />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// ✅ WRAP WITH GOOGLE OAUTH PROVIDER
createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SocketProvider>
          <AppRouter />
        </SocketProvider>
      </PersistGate>
    </Provider>
  </GoogleOAuthProvider>
);
