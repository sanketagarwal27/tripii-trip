import Filters from "@/components/marketPlace/Filters";
import { House } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const MarketPlaceLayout = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex w-full h-screen overflow-hidden"
      style={{ marginTop: "50px", display: "block", padding: "20px" }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ fontSize: "40px", fontWeight: "700" }}>
            Trip MarketPlace
          </h1>
          <p style={{ color: "grey" }}>Explore your next adventure😉</p>
        </div>
        <button
          onClick={() => navigate("/marketplace/list-business")}
          className="submit-form-button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontSize: "12px",
            height: "40px",
            backgroundColor: "#00ffe5",
            marginTop: "20px",
            padding: "0 10px",
            borderRadius: "12px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <House size="16px" /> List your Business
        </button>
      </div>

      <div
        style={{
          marginTop: "30px",
          display: "flex",
          width: "100%",
          height: "calc(100vh - 80px)",
        }}
      >
        <Filters />

        {/* MAIN CONTENT AREA */}
        <main
          className="flex-1"
          style={{
            marginLeft: "18.5vw", // sidebar width
            height: "calc(100vh - 80px)",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MarketPlaceLayout;
