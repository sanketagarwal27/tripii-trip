import React, { useState } from "react";
import styles from "./SearchBox.module.css";

const SearchBox = ({ onSearch }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input); // Send the search term back to the parent
    }
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchCard}>
        <h1 className={styles.title}>Where to next?</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Kyoto, Japan"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className={styles.button}>
            Explore
          </button>
        </form>
        <p className={styles.helper}>
          Try searching for "Paris", "Tokyo", or "New York"
        </p>
      </div>
    </div>
  );
};

export default SearchBox;
