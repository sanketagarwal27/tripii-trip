import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Forms.module.css"; // Uses the same theme
import {
  ArrowLeft,
  MapPin,
  Camera,
  Star,
  PlusCircle,
  Clock,
} from "lucide-react";
import { useContribution } from "@/context/ContributionContext";

const Spot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errors, setErrors] = useState({});
  const { tripMeta, addToTimeline, updateTimeline } = useContribution();
  const { editData } = location.state || {};
  const [formData, setFormData] = useState({
    placeName: editData?.placeName || "",
    category: editData?.category || "Activity", // museum, park, adventure, historical
    location: editData?.location || "",
    dateOfVisit: editData?.dateOfVisit || tripMeta.date || "",
    timeSpent: editData?.timeSpent || "",
    isFree: editData?.isFree || true,
    entryCost: editData?.entryCost || "",
    rating: editData?.rating || 0,
    description: editData?.description || "",
    images: editData?.images || [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isEditing = !!editData;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.rating === 0) {
      setErrors((prev) => ({
        ...prev,
        rating: "Please provide an overall rating.",
      }));
      return;
    }
    if (isEditing) {
      updateTimeline(editData.id, { ...formData, type: "Tourist Spot" });
      navigate(-1);
    } else {
      addToTimeline({
        ...formData,
        type: "Tourist Spot",
      });
      navigate(-1);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          <ArrowLeft size={24} />
        </button>
        <h1>Add Tourist Spot</h1>
      </header>

      <form className={styles.formWrapper} onSubmit={handleSubmit}>
        {/* BASICS */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>The Place</h3>
          <div className={styles.inputGroup}>
            <label>Name of Spot</label>
            <input
              type="text"
              name="placeName"
              value={formData.placeName}
              onChange={handleChange}
              placeholder="e.g. Louvre Museum"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.rowGrid}>
            <div className={styles.inputGroup}>
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="Historical">Historical / Monument</option>
                <option value="Nature">Nature / Park</option>
                <option value="Gallery">Museum / Gallery</option>
                <option value="Activity">Adventure / Activity</option>
                <option value="Viewpoint">Viewpoint</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Location</label>
              <div className={styles.iconInputWrapper}>
                <MapPin size={18} className={styles.inputIcon} />
                <input
                  placeholder={`Where in ${tripMeta.location} ?`}
                  type="text"
                  required
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.hasIcon}`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* LOGISTICS */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>Logistics</h3>

          <div className={styles.rowGrid}>
            <div className={styles.inputGroup}>
              <label>Time Spent</label>
              <div className={styles.iconInputWrapper}>
                <Clock size={18} className={styles.inputIcon} />
                <select
                  name="timeSpent"
                  value={formData.timeSpent}
                  onChange={handleChange}
                  className={`${styles.select} ${styles.hasIcon}`}
                >
                  <option value="< 1 hour">&lt; 1 hour</option>
                  <option value="1-3 hours">1-3 hours</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Full Day">Full Day</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Entry Fee</label>
              <div className={styles.toggleRow}>
                <button
                  type="button"
                  className={`${styles.pill} ${
                    formData.isFree ? styles.activePill : ""
                  }`}
                  onClick={() => setFormData({ ...formData, isFree: true })}
                >
                  Free
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${
                    !formData.isFree ? styles.activePill : ""
                  }`}
                  onClick={() => setFormData({ ...formData, isFree: false })}
                >
                  Paid
                </button>
              </div>
              {!formData.isFree && (
                <input
                  type="text"
                  name="entryCost"
                  placeholder="Approx Cost per person in local currency"
                  className={styles.input}
                  style={{ marginTop: "10px" }}
                  value={formData.entryCost}
                  onChange={handleChange}
                  required
                />
              )}
            </div>
          </div>
        </section>

        {/* REVIEW */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>Experience</h3>
          <div className={styles.inputGroup}>
            <label>Overall Rating</label>
            <div className={styles.starRatingWrapper}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={36}
                  fill={star <= formData.rating ? "#fbbd08" : "none"}
                  color={star <= formData.rating ? "#fbbd08" : "#e0e0e0"}
                  className={styles.starBtn}
                  onClick={() => {
                    setFormData({ ...formData, rating: star });
                    if (errors.rating)
                      setErrors((prev) => ({ ...prev, rating: null }));
                  }}
                />
              ))}
            </div>
            {errors.rating && (
              <span
                className={styles.errorText}
                style={{
                  color: "#e74c3c",
                  fontSize: "0.85rem",
                  marginTop: "0.5rem",
                  display: "block",
                }}
              >
                {errors.rating}
              </span>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label>Review / Tips</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Best time to visit? Any hidden gems inside? Any scams?"
              rows={4}
              className={styles.textarea}
            />
          </div>
          <div className={styles.uploadZone}>
            <div className={styles.uploadIconCircle}>
              <Camera size={32} />
            </div>
            <h4>Add Photos of your experience</h4>
          </div>
        </section>

        <div className={styles.footerAction}>
          <button type="submit" className={styles.btnMainCTA}>
            <PlusCircle size={22} /> Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default Spot;
