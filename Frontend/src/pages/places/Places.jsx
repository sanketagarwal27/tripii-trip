import React, { useState } from "react";
import HeroSection from "./components/HeroSection";
import Tabs from "./components/Tabs";
import NewsFeed from "./components/NewsFeed";
import SearchBox from "./components/SearchBox";
import styles from "./Places.module.css";
import { fetchNews, fetchHeroImage } from "@/api/places";

const Places = () => {
  const [activeTab, setActiveTab] = useState("Travel News");
  const [newsArticles, setNewsArticles] = useState([]);
  const [placeData, setPlaceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    setLoading(true);

    try {
      const result = await fetchNews(query);

      if (result && result.data && result.data.articles) {
        const rawArticles = result.data.articles;

        // We use a Map to store "Clean Title" -> "Best Article Found So Far"
        const articleMap = new Map();

        rawArticles.forEach((article) => {
          const rawTitle = article.title;

          // 1. Safety Check
          if (!rawTitle || rawTitle === "[Removed]") return;

          // 2. Normalize Title
          const cleanTitle = rawTitle
            .split(" - ")[0]
            .split(" | ")[0]
            .split("【")[0]
            .trim()
            .toLowerCase();

          // 3. COMPARE LOGIC
          if (!articleMap.has(cleanTitle)) {
            // Case A: First time seeing this title? Save it.
            articleMap.set(cleanTitle, article);
          } else {
            // Case B: We already have this title. Is the NEW one better?
            const existingArticle = articleMap.get(cleanTitle);

            // CRITICAL: If existing has NO image, but new one HAS image -> SWAP IT!
            if (!existingArticle.urlToImage && article.urlToImage) {
              articleMap.set(cleanTitle, article);
            }
          }
        });

        // Convert Map values back to an Array
        const uniqueArticles = Array.from(articleMap.values());

        setNewsArticles(uniqueArticles);

        const axiosResponse = await fetchHeroImage(query);
        const heroUrl = axiosResponse.data || "";

        const newPlaceData = {
          place: query,
          heroImage: heroUrl,
        };

        setPlaceData(newPlaceData);
      } else {
        setNewsArticles([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setNewsArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to reset search (optional, creates a 'Back' button behavior)
  const resetSearch = () => {
    setPlaceData(null);
    setActiveTab("Travel News");
  };

  // 1. LOADING STATE
  if (loading) {
    return (
      <div
        className="container"
        style={{ textAlign: "center", marginTop: "100px" }}
      >
        <h2>Searching for the details</h2>
      </div>
    );
  }

  // 2. SEARCH STATE (Initial View)
  if (!placeData) {
    return <SearchBox onSearch={handleSearch} />;
  }

  // 3. RESULTS STATE (The page we built earlier)
  return (
    <>
      {/* Optional: Add a back button to search again */}
      <div className="container" style={{ marginBottom: "10px" }}>
        <button
          onClick={resetSearch}
          style={{
            background: "none",
            border: "none",
            color: "#666",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          &larr; Search another place
        </button>
      </div>

      <HeroSection place={placeData.place} imageUrl={placeData.heroImage} />

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className={styles.contentArea}>
        {activeTab === "Travel News" && <NewsFeed news={newsArticles} />}

        {activeTab !== "Travel News" && (
          <div className="container">
            <div className={styles.placeholderBox}>
              <h3>
                {activeTab} for {placeData.place}
              </h3>
              <p>Fetching data...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Places;
