import React, { useState } from "react";
import styles from "./NewsCard.module.css";

const NewsCard = ({ image, title, snippet, url }) => {
  return (
    <div className={styles.newsCard}>
      <img src={image} alt={title} className={styles.newsImage} />
      <div className={styles.newsContent}>
        <h3 className={styles.newsTitle}>{title}</h3>
        <p className={styles.newsSnippet}>{snippet}</p>
        <a
          className={styles.sourceLink}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read More &rarr;
        </a>
      </div>
    </div>
  );
};

export default NewsCard;
