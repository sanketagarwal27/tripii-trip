// src/components/layout/Navbar.jsx
import { useSelector } from "react-redux";
import profileimage from "../../public/travel.jpg";
import { Bell, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { logoutRequest } from "@/api/auth";
import { disconnectSocket } from "../../Socket.js";

const Navbar = () => {
  const { userProfile } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  return (
    <div className="navbar">
      {/* Left Logo */}
      <div className="navbar-left">
        <div className="navbar-logo">TripiiTrip</div>
      </div>

      {/* Middle Navigation */}
      <div className="navbar-middle">
        <button onClick={() => navigate("/")}>Home</button>
        <button onClick={() => navigate("/communities")}>Communities</button>
        <button onClick={() => navigate("/chatbot")}>Sunday AI</button>
        <button onClick={() => navigate("/trips")}>Trips</button>
        <button onClick={() => navigate("/places")}>Places</button>
        <button onClick={() => navigate("/contribute")}>Contribute</button>
        <button
          onClick={() => {
            logoutRequest(), disconnectSocket();
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
        {/* <button className="navbar-profile"> */}{" "}
        {/*Done for testing purposes*/}
        <Link to={`/profile/${userProfile._id}`} className="navbar-profile">
          <img
            src={userProfile?.profilePicture?.url || profileimage}
            alt="profile"
          />
        </Link>
        {/* </button> */}
      </div>
    </div>
  );
};

export default Navbar;
