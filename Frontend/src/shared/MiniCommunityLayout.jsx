// shared/MiniCommunityLayout.jsx
import { Outlet } from "react-router-dom";
import LeftSidebar from "@/components/home/LeftSidebar";
import useGetMyCommunities from "@/hooks/useGetMyCommunities";

const MiniCommunityLayout = () => {
  useGetMyCommunities();
  return (
    <div className="flex w-full">
      <LeftSidebar
        // myCommunities={myCommunities}
        // suggestedCommunities={suggestedCommunities}
        myRooms={[]} // update when room API is ready
        suggestedRooms={[]} // update later
      />

      {/* Main center content */}
      <div style={{ marginLeft: "18vw", marginTop: "80px" }}>
        <Outlet />
      </div>
    </div>
  );
};

export default MiniCommunityLayout;
