import Filters from "@/components/marketPlace/Filters";
import { Outlet } from "react-router-dom";

const MarketPlaceLayout = () => {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      <Filters />

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

export default MarketPlaceLayout;
