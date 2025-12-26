// src/components/ProfileTabs.jsx
import React from "react";
import styles from "./ProfileTabs.module.css";

const ProfileTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <div
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`${styles.tab} ${
            activeTab === tab ? styles.activeTab : ""
          }`}
        >
          {tab}
        </div>
      ))}
    </div>
  );
};

export default ProfileTabs;
