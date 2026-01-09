import LeftSidebar from "@/components/home/LeftSidebar";
import RightSidebar from "@/components/home/RightSideBar";
import useGetAllPost from "@/hooks/useGetAllPost";
import { Outlet } from "react-router-dom";

const MiniAppLayout = () => {
  useGetAllPost();
  return (
    <div className="flex w-full">
      {/* LEFT SIDEBAR */}
      <div>
        <LeftSidebar />
      </div>

      {/* CENTER CONTENT */}
      <div style={{ position: "relative", left: "18.5vw" }}>
        <Outlet />
      </div>

      {/* RIGHT SIDEBAR */}
      <div>
        <RightSidebar />
      </div>
    </div>
  );
};

export default MiniAppLayout;
