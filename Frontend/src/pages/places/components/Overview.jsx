import styles from "./overview.module.css";

const Overview = ({ data, setActiveTab }) => {
  if (!data) return <div>Loading...</div>;

  const { wiki, ai, weather } = data.content;

  return (
    <div className={styles.container}>
      <p className={styles.blurb}>{ai.oneLineBlurb.toUpperCase()}</p>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>About the City</h3>
          <p className={styles.summaryText}>{wiki?.summary}</p>
          <div className={styles.touristPlaces}>
            <h2>Tourist Places: </h2>
            <p>
              {ai.touristPlaces.length !== 0
                ? ai.touristPlaces
                : "Several Tourist Spots !"}
            </p>
          </div>
          {/* Think more about displaying tourist places */}
          <div className={styles.redirections}>
            <button onClick={() => setActiveTab("Photos")}>View Photos</button>
          </div>
        </div>
        <div className={styles.statsColumn}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Today's Forecast</h3>
            <div className={styles.weatherRow}>
              <span className={styles.weatherTemp}>
                {((weather.high + weather.low) / 2).toFixed(1)}°C
              </span>
              <div className={styles.weatherLabel}>
                <span>High: {weather.high}°</span>
                <span>Low: {weather.low}°</span>
              </div>
            </div>
            <p style={{ marginTop: "10px", color: "#666" }}>
              {weather.summary}
            </p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>🤑Budget Rating</h3>
            <div className={styles.budgetWrapper}>
              {ai.budgetRating === "Cheap" && (
                <span className={styles.cheapBudget}>Cheap</span>
              )}
              {ai.budgetRating === "Moderate" && (
                <span className={styles.moderateBudget}>Moderate</span>
              )}
              {ai.budgetRating === "Expensive" && (
                <span className={styles.expensiveBudget}>Expensive</span>
              )}
            </div>
          </div>

          <div className={`${styles.card} ${styles.gemCard}`}>
            <h3 className={styles.cardTitle}>💎 Local Secret</h3>
            <p className={styles.gemText}>"{ai.hiddenGem}"</p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Best For</h3>
            <div className={styles.tagContainer}>
              {ai.bestFor.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
