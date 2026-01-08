// shared/TripLayout.jsx
import TripSidebarContainer from "@/components/trip/TripSidebarContainer";
import { Outlet, useMatch } from "react-router-dom";
import { useState, useEffect } from "react";
import useGetMyTrips from "@/hooks/useGetMyTrips";

const TripLayout = () => {
  const [mode, setMode] = useState(2); // default Trip sidebar

  // 🔥 detect trip detail route (useMatch is used for checking which route is currently present and if that matches the route inside useMatch)
  const isTripOpen = useMatch("/trips/trip/:tripId");
  const isTripClose = useMatch("/trips");

  useEffect(() => {
    if (isTripOpen) {
      setMode(1); // switch to Home sidebar
    }
    if (isTripClose) {
      setMode(2);
    }
  }, [isTripOpen]);

  useGetMyTrips();

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <TripSidebarContainer mode={mode} setMode={setMode} />

      <main
        className="flex-1"
        style={{
          marginTop: "80px",
          height: "calc(100vh - 80px)",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default TripLayout;
