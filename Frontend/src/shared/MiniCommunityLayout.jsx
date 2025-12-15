// shared/MiniCommunityLayout.jsx
import { Outlet } from "react-router-dom";
import LeftSidebar from "@/components/home/LeftSidebar";
import useGetMyCommunities from "@/hooks/useGetMyCommunities";

const MiniCommunityLayout = () => {
  useGetMyCommunities();

  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* LEFT SIDEBAR */}
      <LeftSidebar />

      {/* MAIN CONTENT AREA */}
      <main
        className="flex-1"
        style={{
          marginLeft: "18.5vw", // sidebar width
          marginTop: "80px", // navbar height
          height: "calc(100vh - 80px)",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MiniCommunityLayout;
