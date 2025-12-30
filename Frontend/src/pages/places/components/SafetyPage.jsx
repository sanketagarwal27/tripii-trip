import React from "react";
import styles from "./SafetyPage.module.css";

const SafetyPage = ({ safetyData }) => {
  if (!safetyData) return null;

  const { overallSafetyRating, commonScams, travelAdvices } = safetyData;

  const getScoreNumber = (ratingString) => {
    if (!ratingString) return 0;
    const match = ratingString.match(/\d+/);
    return match ? parseFloat(match[0], 10) : 0;
  };

  const numericScore = getScoreNumber(overallSafetyRating);

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 8) return styles.safe;
    if (score >= 5) return styles.moderate;
    return styles.danger;
  };

  return (
    <section className={styles.container}>
      <h2 className={styles.mainTitle}>🛡️ Safety & Security</h2>
      <div className={styles.topSection}>
        <div className={styles.scoreCard}>
          <div className={styles.scoreHeader}>
            <h3>Safety Rating</h3>
          </div>

          <div
            className={`${styles.scoreCircle} ${getScoreColor(numericScore)}`}
          >
            <span className={styles.scoreValue}>{numericScore}</span>
          </div>

          <p className={styles.scoreLabel}>{overallSafetyRating || "N/A"}</p>
        </div>
        <div className={styles.scamsColumn}>
          <h3 className={styles.columnTitle}>⚠️ Common Scams</h3>

          <div className={styles.scamsGrid}>
            {commonScams &&
              commonScams.map((scamText, index) => (
                <div key={index} className={styles.scamCard}>
                  <div className={styles.scamIcon}>!</div>
                  <p className={styles.scamText}>{scamText}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className={styles.adviceCard}>
        <h3>💡 Travel Advice</h3>
        <p className={styles.advice}>{travelAdvices}</p>
      </div>
    </section>
  );
};

export default SafetyPage;
