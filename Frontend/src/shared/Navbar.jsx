import { useSelector, useDispatch } from "react-redux";
import profileimage from "../../public/travel.jpg";
import {
  Bell,
  MessageSquare,
  Menu,
  X,
  Home,
  Users,
  Plane,
  MapPin,
  ShoppingBag,
  Award,
  Shield,
  LogOut,
  User,
  Bot,
  Settings,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoutRequest } from "@/api/auth";
import { disconnectSocket } from "../../Socket.js";
import { logoutUser } from "@/redux/authslice";
import toast from "react-hot-toast";
import { useState } from "react";
import LeftSidebar from "@/components/home/LeftSideBar";
import RightSidebar from "@/components/home/RightSideBar";

// Tooltip Nav Button Component for Mobile
const NavButton = ({ icon: Icon, label, isActive, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      {showTooltip && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-charcoal dark:bg-off-white text-off-white dark:text-charcoal px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg z-50">
          {label}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-charcoal dark:bg-off-white rotate-45"></div>
        </div>
      )}
      <button
        className={`flex flex-col items-center gap-1 transition-colors ${
          isActive ? "text-primary" : "text-charcoal/50 dark:text-off-white/50"
        }`}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setTimeout(() => setShowTooltip(false), 1500)}
      >
        <Icon className="w-6 h-6" />
      </button>
    </div>
  );
};

const Navbar = () => {
  const { user, userProfile } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  /* ---------- ACTIVE CHECKERS ---------- */
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

  /* ✅ FIXED LOGOUT HANDLER */
  const handleLogout = async () => {
    try {
      await logoutRequest();
      disconnectSocket();
      dispatch(logoutUser());
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      disconnectSocket();
      dispatch(logoutUser());
      navigate("/auth");
    }
  };

  // Main nav items for mobile bottom bar (4 items + More)
  const mainNavItems = [
    {
      icon: Home,
      label: "Home",
      action: () => navigate("/"),
      isActive: isHome,
    },
    {
      icon: Users,
      label: "Communities",
      action: () => navigate("/communities"),
      isActive: isCommunity,
    },
    {
      icon: Plane,
      label: "Trips",
      action: () => navigate("/trips"),
      isActive: isTrips,
    },
  ];

  // More menu items (including Sunday AI)
  const moreNavItems = [
    {
      icon: Bot,
      label: "Sunday AI",
      action: () => navigate("/chatbot"),
      isActive: isSunday,
    },
    {
      icon: MapPin,
      label: "Places",
      action: () => navigate("/places"),
      isActive: isPlaces,
    },
    {
      icon: ShoppingBag,
      label: "Marketplace",
      action: () => navigate("/marketplace"),
      isActive: isMarketplace,
    },
    {
      icon: Award,
      label: "Contribute",
      action: () => navigate("/contribute"),
      isActive: isContribution,
    },
    ...(user?.role === "admin"
      ? [
          {
            icon: Shield,
            label: "Admin Panel",
            action: () => navigate("/admin"),
            isActive: isAdminPanel,
          },
        ]
      : []),
    { icon: LogOut, label: "Logout", action: handleLogout, isActive: false },
  ];

  return (
    <>
      {/* Desktop Navbar - Hidden on mobile */}
      <div className="navbar hidden lg:flex">
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

          {user?.role === "admin" && (
            <button
              className={isAdminPanel ? "nav-active" : ""}
              onClick={() => navigate("/admin")}
            >
              Admin Panel
            </button>
          )}

          <button onClick={handleLogout}>Logout</button>
        </div>

        {/* Right Side */}
        <div className="navbar-right">
          <button className="icon-btn">
            <Bell size={22} />
          </button>
          <button className="icon-btn">
            <MessageSquare size={22} />
          </button>

          <Link to={`/profile/${userProfile?._id}`} className="navbar-profile">
            <img
              src={userProfile?.profilePicture?.url || profileimage}
              alt="profile"
            />
          </Link>
        </div>
      </div>

      {/* Mobile Header - Only on mobile */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between border-b border-charcoal/10 dark:border-off-white/10 px-4 py-3 bg-background-light dark:bg-background-dark backdrop-blur-sm">
        <button
          className="p-2 hover:bg-sand/20 rounded-lg transition-colors"
          onClick={() => setLeftOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="text-lg font-bold">TripiiTrip</div>

        <button
          className="p-2 hover:bg-sand/20 rounded-lg transition-colors"
          onClick={() => setRightOpen(true)}
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Left Sidebar Drawer - Mobile Only */}
      {leftOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setLeftOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-background-light dark:bg-background-dark shadow-2xl overflow-y-auto">
            <div className="p-4 border-b border-charcoal/10 dark:border-off-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold">Menu</h3>
              <button
                onClick={() => setLeftOpen(false)}
                className="p-2 hover:bg-sand/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <LeftSidebar />
          </div>
        </div>
      )}

      {/* Right Sidebar Drawer - Mobile Only */}
      {rightOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setRightOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-background-light dark:bg-background-dark shadow-2xl overflow-y-auto">
            <div className="p-4 border-b border-charcoal/10 dark:border-off-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold">Profile & Suggestions</h3>
              <button
                onClick={() => setRightOpen(false)}
                className="p-2 hover:bg-sand/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <RightSidebar />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background-light dark:bg-background-dark border-t border-charcoal/10 dark:border-off-white/10 px-4 py-2 z-50 shadow-lg">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {mainNavItems.map((item, index) => (
            <NavButton
              key={index}
              icon={item.icon}
              label={item.label}
              isActive={item.isActive}
              onClick={item.action}
            />
          ))}

          <NavButton
            icon={Settings}
            label="More"
            isActive={showMore}
            onClick={() => setShowMore(!showMore)}
          />

          <div className="relative">
            <button
              className={`flex flex-col items-center gap-1 transition-colors ${
                isProfile
                  ? "text-primary"
                  : "text-charcoal/50 dark:text-off-white/50"
              }`}
              onClick={() => navigate(`/profile/${userProfile?._id}`)}
            >
              <img
                src={userProfile?.profilePicture?.url || profileimage}
                alt="profile"
                className="w-6 h-6 rounded-full border border-charcoal/20"
              />
            </button>
          </div>
        </div>
      </nav>

      {/* More Menu Popup - Mobile */}
      {showMore && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
          <div className="absolute bottom-16 right-4 w-64 bg-background-light dark:bg-background-dark rounded-2xl shadow-2xl border border-charcoal/10 dark:border-off-white/10 overflow-hidden">
            <div className="p-3 border-b border-charcoal/10 dark:border-off-white/10">
              <h3 className="font-bold text-sm">More Options</h3>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {moreNavItems.map((item, index) => (
                <button
                  key={index}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-primary/10 transition-colors ${
                    item.isActive ? "bg-primary/10 text-primary" : ""
                  }`}
                  onClick={() => {
                    item.action();
                    setShowMore(false);
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
