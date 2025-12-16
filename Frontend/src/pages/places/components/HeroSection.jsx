import React from "react";
import styles from "./HeroSection.module.css";

const HeroSection = ({ place, imageUrl }) => {
  return (
    <>
      <div
        className={styles.heroCard}
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        <div className={styles.textWrapper}>
          <h1 className={styles.heroTitle}>{place}</h1>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
