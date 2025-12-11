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
import Chatbot from "./pages/chatbot/Chatbot.jsx";
import CommunityHub from "./components/community/CommunityHub";
import { GoogleOAuthProvider } from "@react-oauth/google";

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
            <Route path="/community" element={<CommunityHub />} />
          </Route>

          {/* Sunday AI layout */}
          <Route element={<MiniSundayLayout />}>
            <Route path="/chatbot" element={<Chatbot />} />
          </Route>
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
        <AppRouter />
      </PersistGate>
    </Provider>
  </GoogleOAuthProvider>
);
