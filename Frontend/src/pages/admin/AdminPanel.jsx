import React, { useState } from "react";
import styles from "./AdminPanel.module.css";
import {
  FaChartLine,
  FaUsers,
  FaShieldAlt,
  FaExclamationTriangle,
  FaCogs,
  FaTrash,
} from "react-icons/fa";
import {
  BriefcaseBusiness,
  Hotel,
  LucideVerified,
  Sparkles,
  Store,
  Trophy,
  UserRound,
  Verified,
} from "lucide-react";
import VerifyContributions from "./components/VerifyContribution";
import AwardRandomPoints from "./components/AwardRandomPoints";
import UserManagement from "./components/UserManagement";
import AppDashboard from "./components/AppDashboard";
import ManageCommunities from "./components/ManageCommunities";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Admin Menu Options
  const menuItems = [
    { id: "dashboard", label: "Overview", icon: <FaChartLine /> },
    { id: "users", label: "User Management", icon: <UserRound size={18} /> },
    {
      id: "communities",
      label: "Community Management",
      icon: <FaUsers />,
    },
    { id: "sunday", label: "Manage Sunday AI", icon: <Sparkles size={18} /> },
    {
      id: "contributions",
      label: "Verify Contributions",
      icon: <LucideVerified size={18} />,
    },
    {
      id: "business",
      label: "Manage Businesses",
      icon: <BriefcaseBusiness size={18} />,
    },
    {
      id: "marketplace",
      label: "Manage Marketplace",
      icon: <Store size={18} />,
    },
    {
      id: "points",
      label: "Award Points",
      icon: <Trophy size={18} />,
    },
    { id: "reports", label: "User Reports", icon: <FaExclamationTriangle /> },
  ];

  // Dummy Data for visual demonstration
  const recentReports = [
    {
      id: 1,
      type: "Post",
      reason: "Spam",
      user: "@user123",
      status: "Pending",
    },
    {
      id: 2,
      type: "Comment",
      reason: "Harassment",
      user: "@travel_junkie",
      status: "Reviewed",
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": {
        return <AppDashboard />;
      }
      case "contributions": {
        return <VerifyContributions />;
      }
      case "points": {
        return <AwardRandomPoints />;
      }
      case "users": {
        return <UserManagement />;
      }
      case "communities": {
        return <ManageCommunities />;
      }
      default:
        return (
          <div className={styles.contentCard}>
            <h3>{menuItems.find((i) => i.id === activeTab)?.label}</h3>
            <p className={styles.placeholderText}>
              Select an option to view details.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.layoutGrid}>
        {/* Left Sidebar - Mimics "My Rooms" style */}
        <aside className={styles.sidebarCard}>
          <div className={styles.sidebarHeader}>
            <h3>Admin Tools</h3>
          </div>
          <ul className={styles.menuList}>
            {menuItems.map((item) => (
              <li
                key={item.id}
                className={`${styles.menuItem} ${
                  activeTab === item.id ? styles.active : ""
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </aside>

        {/* Right Content - Mimics Feed/Profile style */}
        <main className={styles.mainArea}>{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminPanel;
