// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider, useSelector } from "react-redux";
import { store, persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Chatbot from "./pages/chatbot/Chatbot.jsx";
import AuthPage from "@/pages/auth/AuthPage";

import "./index.css";
import AppLayout from "./shared/AppLayout";
import HomePage from "./pages/auth/HomePage";
import CommentPage from "./components/home/CommentPage";
import MiniAppLayout from "./shared/MiniAppLayout";

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
        <Route
          path="/auth"
          element={
            <NoAuth>
              <AuthPage />
            </NoAuth>
          }
        />
        <Route path="/chatbot" element={<Chatbot />} />
        
        {/* Protected Layout */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {/* Mini layout with sidebar */}
          <Route element={<MiniAppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:id" element={<CommentPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <AppRouter />
    </PersistGate>
  </Provider>
);
