import { useState, useEffect } from "react";
import styles from "./LandingPage.module.css";
import { getSuggestedPlaces } from "@/api/places";
import { useNavigate } from "react-router-dom";

const categories = [
  "All Places",
  "Beaches",
  "Mountains",
  "Cities",
  "Historical",
  "Nature",
  "Cuisines",
];

const SearchBox = ({ onSearch }) => {
  const [input, setInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Places");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input);
    }
  };

  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoadingPlaces(true);
        const res = await getSuggestedPlaces();
        setPlaces(res.data || []);
      } catch (err) {
        console.error("Error fetching places:", err);
      } finally {
        setLoadingPlaces(false);
      }
    };

    loadPlaces();
  }, []);

  const priceDisplayer = (place) => {
    const budget = place.overview?.aiData?.budgetRating;
    if (budget === "Expensive") return "$$$";
    else if (budget === "Moderate") return "$$";
    else return "$";
  };

  const navigate = useNavigate();
  const handlePlaceClick = (placeName) => {
    navigate(`/places/?query=${placeName}`);
  };

  const filteredPlaces = places.filter((place) => {
    if (activeCategory === "All Places") return true;
    const placeCategories = place.overview?.aiData?.bestFor || [];
    return placeCategories.includes(activeCategory);
  });

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

      {loadingPlaces && (
        <p className={styles.loadingPlaces}>Loading Suggestions for you...</p>
      )}

      {/* Suggested Places */}
      {!loadingPlaces && (
        <div className={styles.suggestedPlaces}>
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map((place, indx) => (
              <div
                className={styles.suggestedPlaceCard}
                key={indx}
                onClick={() => handlePlaceClick(place.place)}
              >
                <div className={styles.imageContainer}>
                  <img
                    className={styles.image}
                    src={place.heroImageUrl}
                    alt={place.place}
                  />
                  <div className={styles.ratingBadge}>
                    <span>★</span> {place.rating || "4.5"}
                  </div>
                </div>

                <div className={styles.infoContainer}>
                  <div className={styles.headerRow}>
                    <h3 className={styles.placeName}>{place.place}</h3>
                    <span className={styles.price}>
                      {priceDisplayer(place)}
                    </span>
                  </div>

                  <p className={styles.description}>
                    {place.overview?.aiData?.oneLineBlurb ||
                      `Experience the rich culture of ${place.place}`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                color: "#888",
              }}
            >
              No places found for {activeCategory}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default SearchBox;
