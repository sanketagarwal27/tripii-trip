import React, { useState, useEffect, useCallback } from "react"; // Import useEffect and useCallback
import { useSearchParams } from "react-router-dom"; // Import this hook
import HeroSection from "./components/HeroSection";
import Tabs from "./components/Tabs";
import NewsFeed from "./components/NewsFeed";
import LandingPage from "./components/LandingPage";
import styles from "./Places.module.css";
import {
  fetchNews,
  fetchHeroImage,
  fetchPhotos,
  fetchOverview,
  fetchSafety,
} from "@/api/places";
import PhotoSection from "./components/PhotoSection";
import Overview from "./components/Overview";
import SafetyPage from "./components/SafetyPage";

const Places = () => {
  // 1. Setup Search Params
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("query"); // Gets value of ?query=...

  const [activeTab, setActiveTab] = useState("Travel News");
  const [newsArticles, setNewsArticles] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [overview, setOverview] = useState(null);
  const [safetyData, setSafetyData] = useState({});
  const [placeData, setPlaceData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 2. Wrap handleSearch in useCallback to prevent infinite loops in useEffect
  const handleSearch = useCallback(async (query) => {
    if (!query) return;

    setLoading(true);
    try {
      const [
        newsResult,
        heroImageResult,
        photosResult,
        overviewResult,
        safetyResult,
      ] = await Promise.all([
        fetchNews(query),
        fetchHeroImage(query),
        fetchPhotos(query),
        fetchOverview(query),
        fetchSafety(query),
      ]);

      if (newsResult?.data?.articles) {
        const articleMap = new Map();
        newsResult.data.articles.forEach((article) => {
          if (!article?.title || article.title === "[Removed]") return;
          const cleanTitle = article.title
            .split(" - ")[0]
            .split(" | ")[0]
            .split("【")[0]
            .trim()
            .toLowerCase();

          if (
            !articleMap.has(cleanTitle) ||
            (!articleMap.get(cleanTitle)?.urlToImage && article.urlToImage)
          ) {
            articleMap.set(cleanTitle, article);
          }
        });
        setNewsArticles(Array.from(articleMap.values()));
      } else {
        setNewsArticles([]);
      }

      setPlaceData({
        place: query,
        heroImage: heroImageResult?.data || "",
      });

      setPhotos(photosResult?.data || []);
      setOverview(overviewResult?.data || null);
      setSafetyData(safetyResult?.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Effect to trigger search when URL changes
  useEffect(() => {
    if (queryFromUrl) {
      // If URL has ?query=Paris, fetch data for Paris
      handleSearch(queryFromUrl);
    } else {
      // If URL has no query, reset state to show Landing Page
      setPlaceData(null);
    }
  }, [queryFromUrl, handleSearch]);

  // 4. Update internal search to change URL
  const onInternalSearch = (query) => {
    setSearchParams({ query: query }); // This updates URL to ?query=... which triggers the useEffect
  };

  const resetSearch = () => {
    setSearchParams({}); // Clears the URL params
    setPlaceData(null);
    setActiveTab("Travel News");
  };

  if (loading) {
    return (
      <div className="container text-center mt-24">
        <h2>Searching for the details...</h2>
      </div>
    );
  }

  if (!placeData) {
    // Pass the new internal search handler
    return <LandingPage onSearch={onInternalSearch} />;
  }

  return (
    <>
      <div
        onClick={resetSearch}
        style={{
          position: "absolute",
          top: "90px",
          left: "20px",
          zIndex: 2,
          padding: "0 12px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontWeight: 700, color: "#fff" }}>Back</span>
      </div>

      <div style={{ marginTop: "70px" }}>
        <HeroSection place={placeData.place} imageUrl={placeData.heroImage} />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className={styles.contentArea}>
          {activeTab === "Travel News" && <NewsFeed news={newsArticles} />}
          {activeTab === "Photos" && <PhotoSection photos={photos} />}
          {activeTab === "Overview" && (
            <Overview data={overview} setActiveTab={setActiveTab} />
          )}
          {activeTab === "Safety & Scams" && (
            <SafetyPage safetyData={safetyData} />
          )}
        </div>
      </div>
    </>
  );
};

export default Places;
