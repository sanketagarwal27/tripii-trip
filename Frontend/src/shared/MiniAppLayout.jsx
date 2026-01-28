import LeftSidebar from "@/components/home/LeftSideBar";
import RightSidebar from "@/components/home/RightSideBar";
import useGetAllPost from "@/hooks/useGetAllPost";
import { Outlet } from "react-router-dom";

const MiniAppLayout = () => {
  useGetAllPost();
  return (
    <div className="flex w-full max-w-screen-xl mx-auto">
      {/* LEFT SIDEBAR - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block lg:w-64 xl:w-72">
        <LeftSidebar />
      </div>

      {/* CENTER CONTENT */}
      <div className="flex-1 lg:mx-6 w-full">
        <Outlet />
      </div>

      {/* RIGHT SIDEBAR - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block lg:w-80 xl:w-96">
        <RightSidebar />
      </div>
    </div>
  );
};

export default MiniAppLayout;
