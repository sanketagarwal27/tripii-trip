import React from "react";
import styles from "./Tabs.module.css";

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = ["Overview", "Travel News", "Photos", "Safety & Scams"];

  return (
    <div className="container">
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab}
            // Use template literals to conditionally add the 'active' class
            className={`${styles.tabBtn} ${
              activeTab === tab ? styles.active : ""
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <hr className={styles.tabsDivider} />
    </div>
  );
};

export default Tabs;
