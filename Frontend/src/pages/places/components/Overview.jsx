import styles from "./overview.module.css";

const Overview = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  const { wiki, ai, weather } = data.content;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <img
          src={wiki.imageUrl}
          alt={data.location.name}
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay}>
          <h1 className={styles.title}>{data.location.name}</h1>
          <p className={styles.blurb}>{ai.oneLineBlurb}</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>About the City</h3>
          <p className={styles.summaryText}>{wiki.summary}</p>
        </div>

        <div className={styles.statsColumn}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Today's Forecast</h3>
            <div className={styles.weatherRow}>
              <span className={styles.weatherTemp}>{weather.high}°C</span>
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
            <h3 className={styles.cardTitle}>Budget Rating</h3>
            <div className={styles.budgetWrapper}>
              <span
                className={
                  ai.budgetRating.length >= 1
                    ? styles.activeCost
                    : styles.inactiveCost
                }
              >
                $
              </span>
              <span
                className={
                  ai.budgetRating.length >= 2
                    ? styles.activeCost
                    : styles.inactiveCost
                }
              >
                $
              </span>
              <span
                className={
                  ai.budgetRating.length >= 3
                    ? styles.activeCost
                    : styles.inactiveCost
                }
              >
                $
              </span>
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
