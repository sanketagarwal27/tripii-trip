import LeftSidebar from "@/components/home/LeftSidebar";
import { Outlet } from "react-router-dom";

const MiniCommunityLayout = () => {
  return (
    <div className="flex w-full">
      {/* LEFT SIDEBAR */}
      <div>
        <LeftSidebar />
      </div>

      {/* CENTER CONTENT */}

      <div style={{ position: "relative", left: "20vw", top: "80px" }}>
        <Outlet />
      </div>
    </div>
  );
};

export default MiniCommunityLayout;
