import React from "react";
import styles from "./NewsCard.module.css";

const NewsCard = ({ image, title, snippet, date }) => {
  return (
    <div className={styles.newsCard}>
      <img src={image} alt={title} className={styles.newsImage} />
      <div className={styles.newsContent}>
        <h3 className={styles.newsTitle}>{title}</h3>
        <p className={styles.newsSnippet}>{snippet}</p>
        <span className={styles.newsDate}>{date}</span>
      </div>
    </div>
  );
};

export default NewsCard;
