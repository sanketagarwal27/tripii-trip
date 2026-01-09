import { useSelector } from "react-redux";
import profileimage from "../../public/travel.jpg";
import { Bell, MessageSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoutRequest } from "@/api/auth";
import { disconnectSocket } from "../../Socket.js";

const Navbar = () => {
  const { user, userProfile } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* ---------- ACTIVE CHECKERS ---------- */
  const isActive = (path) => pathname === path;

  const isCommunity =
    pathname.startsWith("/community") || pathname.startsWith("/communities");
  const isTrips = pathname.startsWith("/trips");
  const isPlaces = pathname.startsWith("/places");
  const isSunday = pathname.startsWith("/chatbot");
  const isContribution = pathname.startsWith("/contribute");
  const isAdminPanel = pathname.startsWith("/admin");
  const isProfile = pathname.startsWith("/profile");
  const isMarketplace = pathname.startsWith("/marketplace");
  const isHome =
    pathname === "/" ||
    (!isCommunity &&
      !isTrips &&
      !isPlaces &&
      !isSunday &&
      !isContribution &&
      !isAdminPanel &&
      !isProfile &&
      !isMarketplace);

  return (
    <div className="navbar">
      {/* Left Logo */}
      <div className="navbar-left">
        <div className="navbar-logo">TripiiTrip</div>
      </div>

      {/* Middle Navigation */}
      <div className="navbar-middle">
        <button
          className={isHome ? "nav-active" : ""}
          onClick={() => navigate("/")}
        >
          Home
        </button>

        <button
          className={isCommunity ? "nav-active" : ""}
          onClick={() => navigate("/communities")}
        >
          Communities
        </button>

        <button
          className={isSunday ? "nav-active" : ""}
          onClick={() => navigate("/chatbot")}
        >
          Sunday AI
        </button>

        <button
          className={isTrips ? "nav-active" : ""}
          onClick={() => navigate("/trips")}
        >
          Trips
        </button>

        <button
          className={isPlaces ? "nav-active" : ""}
          onClick={() => navigate("/places")}
        >
          Places
        </button>

        <button
          className={isMarketplace ? "nav-active" : ""}
          onClick={() => navigate("/marketplace")}
        >
          MarketPlace
        </button>

        <button
          className={isContribution ? "nav-active" : ""}
          onClick={() => navigate("/contribute")}
        >
          Contribute
        </button>

        {user.role === "admin" && (
          <button
            className={isAdminPanel ? "nav-active" : ""}
            onClick={() => navigate("/admin")}
          >
            {" "}
            Admin Panel{" "}
          </button>
        )}

        <button
          onClick={() => {
            logoutRequest();
            disconnectSocket();
            navigate("/auth");
          }}
        >
          Logout
        </button>
      </div>

      {/* Right Side */}
      <div className="navbar-right">
        <button className="icon-btn">
          <Bell size={22} />
        </button>
        <button className="icon-btn">
          <MessageSquare size={22} />
        </button>

        <Link to={`/profile/${userProfile._id}`} className="navbar-profile">
          <img
            src={userProfile?.profilePicture?.url || profileimage}
            alt="profile"
          />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
