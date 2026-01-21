import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import useGetAllPost from "@/hooks/useGetAllPost";
import useGetSuggestedCommunities from "@/hooks/useGetSuggestedCommunities";
import useGetMyCommunities from "@/hooks/useGetMyCommunities";
import useGetRooms from "@/hooks/useGetRooms";
import useGetMyTrips from "@/hooks/useGetMyTrips";
import GlobalUploadBar from "@/components/GlobalUploadBar";
import useBootstrapAuth from "@/hooks/useBootstrapAuth";
import TripiiTripLogo from "@/assets/TripiiTripLogo";

const AppLayout = () => {
  const { loading, error } = useGetAllPost();

  useGetSuggestedCommunities();
  useGetMyCommunities();
  useGetRooms();
  useBootstrapAuth();
  useGetMyTrips();

  // ⏳ minimum splash time
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); //  seconds

    return () => clearTimeout(timer);
  }, []);

  // 🔥 show loader until BOTH conditions are satisfied
  if (loading || showSplash) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <TripiiTripLogo size={200} />
      </div>
    );
  }

  if (error) return <p>Error loading posts</p>;

  return (
    <div>
      <Navbar />
      <GlobalUploadBar />
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
