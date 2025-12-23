import { useState } from "react";
import styles from "./LandingPage.module.css";

const categories = [
  "All Places",
  "Beaches",
  "Mountains",
  "Cities",
  "Historical",
  "Nature",
];

const SearchBox = ({ onSearch }) => {
  const [input, setInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Places");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input); // Send the search term back to the parent
    }
  };

  return (
    <section className={styles.wrapper}>
      <h1 className={styles.heading}>Discover Amazing Places</h1>

      <p className={styles.subheading}>
        Find your next adventure from our curated list of breathtaking
        destinations around the globe.
      </p>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className={styles.searchBar}>
        <div className={styles.inputWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search places..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button type="submit">Search</button>
      </form>

      {/* Category Pills */}
      <div className={styles.categories}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.pill} ${
              activeCategory === cat ? styles.active : ""
            }`}
            onClick={() => setActiveCategory(cat)}
            type="button"
          >
            {cat}
          </button>
        ))}
      </div>
    </section>
  );
};

export default SearchBox;