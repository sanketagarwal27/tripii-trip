// src/components/AuthWrapper.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

const AuthWrapper = ({ children }) => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // ✅ Check if user is authenticated
    const checkAuth = async () => {
      // Allow auth page without checks
      if (location.pathname === "/auth") {
        console.log("📍 On auth page, skipping auth check");
        setIsReady(true);
        return;
      }

      // Check Redux state first
      if (user && accessToken) {
        console.log("✅ User authenticated from Redux:", user.username);
        setIsReady(true);
        return;
      }

      // Check localStorage as fallback
      const storedToken = localStorage.getItem("accessToken");
      const storedUserId = localStorage.getItem("userId");

      if (storedToken && storedUserId) {
        console.log("✅ User authenticated from localStorage");
        // Give Redux persist time to rehydrate (200ms delay)
        await new Promise((resolve) => setTimeout(resolve, 200));
        setIsReady(true);
        return;
      }

      // No authentication found - redirect to auth
      console.warn("⚠️ No authentication found, redirecting to /auth");
      navigate("/auth", { replace: true });
    };

    checkAuth();
  }, [user, accessToken, location.pathname, navigate]);

  // Show loading while checking auth
  if (!isReady) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f9fafb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #40E0D0",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Verifying authentication...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return children;
};

export default AuthWrapper;
