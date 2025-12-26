import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import useGetAllPost from "@/hooks/useGetAllPost";
import useGetSuggestedCommunities from "@/hooks/useGetSuggestedCommunities";
import useGetMyCommunities from "@/hooks/useGetMyCommunities";
import useGetRooms from "@/hooks/useGetRooms";

const AppLayout = () => {
  const { loading, error } = useGetAllPost();
  useGetSuggestedCommunities();
  useGetMyCommunities();
  useGetRooms();
  if (loading) return <p>Loading posts...</p>;
  if (error) return <p>Error loading posts</p>;
  return (
    <div>
      <Navbar />
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
