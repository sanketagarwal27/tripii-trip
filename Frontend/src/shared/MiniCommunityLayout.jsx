// shared/MiniCommunityLayout.jsx
import { Outlet } from "react-router-dom";
import LeftSidebar from "@/components/home/LeftSideBar.jsx";

const MiniCommunityLayout = () => {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* LEFT SIDEBAR - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block lg:w-0 xl:w-0">
        <LeftSidebar />
      </div>

      {/* MAIN CONTENT AREA */}
      <main
        className="flex-1"
        style={{
          // marginTop: "80px", // navbar height
          // height: "calc(100vh - 80px)",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MiniCommunityLayout;
