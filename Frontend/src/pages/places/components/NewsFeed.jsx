import React from "react";
import NewsCard from "./NewsCard";
import styles from "./NewsFeed.module.css";

const NewsFeed = ({ news }) => {
  if (!news || news.length === 0) {
    return (
      <div className={styles.newsFeedSection}>
        <h2 className={styles.sectionHeader}>Latest Travel News</h2>
        <p className={styles.noNews}>No recent news found for this location.</p>
      </div>
    );
  }

  return (
    <div className={styles.newsFeedSection}>
      <h2 className={styles.sectionHeader}>Latest Travel News</h2>
      <div className={styles.newsList}>
        {news.map((article) => (
          <NewsCard
            key={article.url}
            title={article.title}
            snippet={article.description}
            image={article.urlToImage} //Todo: Add a random pic of the place searched if image not found
            url={article.url}
          />
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
