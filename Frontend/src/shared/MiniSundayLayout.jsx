import LeftSidebar from "@/components/home/LeftSidebar";
import { Outlet } from "react-router-dom";

const MiniSundayLayout = () => {
  return (
    <div className="flex w-full">
      {/* LEFT SIDEBAR */}
      <div>
        <LeftSidebar />
      </div>

      {/* CENTER CONTENT */}

      <div style={{ position: "relative", left: "19vw", top: "60px" }}>
        <Outlet />
      </div>
    </div>
  );
};

export default MiniSundayLayout;
