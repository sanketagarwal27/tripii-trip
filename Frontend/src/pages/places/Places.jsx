import React, { useState } from "react";
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
  const [activeTab, setActiveTab] = useState("Travel News");
  const [newsArticles, setNewsArticles] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [overview, setOverview] = useState(null);
  const [safetyData, setSafetyData] = useState({});
  const [placeData, setPlaceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    if(!query) {
      return;
    }
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
  };

  const resetSearch = () => {
    setPlaceData(null);
    setActiveTab("Travel News");
  };

  if (loading) {
    return (
      <div className="container text-center mt-24">
        <h2>Searching for the details</h2>
      </div>
    );
  }

  if (!placeData) {
    return <LandingPage onSearch={handleSearch} />;
  }

  return (
    <>
      {/* Back Button */}
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
