import React, { useState } from "react";
import { useContribution } from "@/context/ContributionContext";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Forms.module.css";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Camera,
  Star,
  PlusCircle,
} from "lucide-react";

const Accomodation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [errors, setErrors] = useState({});
  const { tripMeta, addToTimeline, updateTimeline } = useContribution();
  const { editData } = location.state || {};

  const [formData, setFormData] = useState({
    placeName: editData?.placeName || "",
    category: editData?.category || "Hotel",
    location: editData?.location || "",
    dateOfVisit: editData?.dateOfVisit || tripMeta.date || "",
    description: editData?.description || "",
    rating: editData?.rating || 0,
    hospitality: editData?.hospitality || 0,
    rooms: editData?.rooms || 0,
    hotelStars: editData?.hotelStars || "",
    hostelVibe: editData?.hostelVibe || "",
    amenities: editData?.amenities || [],
    images: editData?.images || [],
  });

  const isEditing = !!editData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.rating === 0) {
      setErrors((prev) => ({ ...prev, rating: "Please give overall rating." }));
      return;
    }
    if (formData.hospitality === 0) {
      setErrors((prev) => ({
        ...prev,
        hospitality: "Please give Hospitality rating.",
      }));
      return;
    }
    if (formData.rooms === 0) {
      setErrors((prev) => ({
        ...prev,
        rooms: "Please give rating for the rooms.",
      }));
      return;
    }
    setErrors({});
    if (isEditing) {
      updateTimeline(editData.id, { ...formData, type: "Accommodation" });
      navigate(-1);
    } else {
      addToTimeline({ ...formData, type: "Accommodation" });
      navigate(-1);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          <ArrowLeft size={24} />
        </button>
        <h1>Add Accommodation</h1>
      </header>

      <form className={styles.formWrapper} onSubmit={handleSubmit}>
        {/* SECTION 1: The Basics */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>The Basics</h3>

          <div className={styles.inputGroup}>
            <label>Name of Place</label>
            <input
              type="text"
              name="placeName"
              value={formData.placeName}
              onChange={handleChange}
              placeholder="e.g. The Grand Budapest Hotel"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.rowGrid}>
            <div className={styles.inputGroup}>
              <label>Type</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="Hotel">Hotel</option>
                <option value="Hostel">Hostel</option>
                <option value="Resort">Resort</option>
                <option value="Homestay">Homestay/Airbnb</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Location</label>
              <div className={styles.iconInputWrapper}>
                <MapPin size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  name="location"
                  placeholder={`Where in ${tripMeta.location} ?`}
                  value={formData.location}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.hasIcon}`}
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Date of Visit</label>
            <div className={styles.iconInputWrapper}>
              <Calendar size={18} className={styles.inputIcon} />
              <input
                type="date"
                name="dateOfVisit"
                value={formData.dateOfVisit}
                onChange={handleChange}
                className={`${styles.input} ${styles.hasIcon}`}
                required
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: Details & Vibe */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>Details & Vibe</h3>

          {formData.category === "Hotel" || formData.category === "Resort" ? (
            <div className={styles.inputGroup}>
              <label>Official Star Rating</label>
              <div className={styles.pillContainer}>
                {["3 Star", "4 Star", "5 Star", "Luxury"].map((opt) => (
                  <button
                    key={opt}
                    aria-required
                    type="button"
                    className={`${styles.pill} ${
                      formData.hotelStars === opt ? styles.activePill : ""
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, hotelStars: opt })
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.inputGroup}>
              <label>Atmosphere / Vibe</label>
              <div className={styles.pillContainer}>
                {["Quiet/Work", "Social", "Party", "Nature"].map((vibe) => (
                  <button
                    aria-required
                    key={vibe}
                    type="button"
                    className={`${styles.pill} ${
                      formData.hostelVibe === vibe ? styles.activePill : ""
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, hostelVibe: vibe })
                    }
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>Amenities</label>
            <div className={styles.amenitiesGrid}>
              {[
                "Wifi",
                "Pool",
                "Breakfast",
                "AC",
                "Kitchen",
                "Restaurant",
                "Bar",
                "Cafe",
                "Gym",
                "Parking",
              ].map((item) => (
                <div
                  key={item}
                  className={`${styles.amenityCard} ${
                    formData.amenities.includes(item)
                      ? styles.activeAmenity
                      : ""
                  }`}
                  onClick={() => handleAmenityToggle(item)}
                >
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: Review & Photos */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>Your Experience</h3>
          <div className={styles.inputGroup}>
            <label>Overall Rating</label>
            <div className={styles.starRatingWrapper}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={36}
                  // Using a deeper gold/orange for better contrast
                  fill={star <= formData.rating ? "#fbbd08" : "none"}
                  color={star <= formData.rating ? "#fbbd08" : "#e0e0e0"}
                  className={styles.starBtn}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, rating: star }));
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
            <label>Rooms Rating</label>
            <div className={styles.starRatingWrapper}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={36}
                  fill={star <= formData.rooms ? "#fbbd08" : "none"}
                  color={star <= formData.rooms ? "#fbbd08" : "#e0e0e0"}
                  className={styles.starBtn}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, rooms: star }));
                    if (errors.rooms)
                      setErrors((prev) => ({ ...prev, rooms: null }));
                  }}
                />
              ))}
            </div>
            {errors.rooms && (
              <span
                className={styles.errorText}
                style={{
                  color: "#e74c3c",
                  fontSize: "0.85rem",
                  marginTop: "0.5rem",
                  display: "block",
                }}
              >
                {errors.rooms}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Hospitality Rating</label>
            <div className={styles.starRatingWrapper}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={36}
                  fill={star <= formData.hospitality ? "#fbbd08" : "none"}
                  color={star <= formData.hospitality ? "#fbbd08" : "#e0e0e0"}
                  className={styles.starBtn}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, hospitality: star }));
                    if (errors.hospitality)
                      setErrors((prev) => ({ ...prev, hospitality: null }));
                  }}
                />
              ))}
            </div>
            {errors.hospitality && (
              <span
                className={styles.errorText}
                style={{
                  color: "#e74c3c",
                  fontSize: "0.85rem",
                  marginTop: "0.5rem",
                  display: "block",
                }}
              >
                {errors.hospitality}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Review</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What was memorable? Share tips for future travelers."
              rows={5}
              className={styles.textarea}
            />
          </div>

          <div className={styles.uploadZone}>
            <div className={styles.uploadIconCircle}>
              <Camera size={32} />
            </div>
            <h4>Add Photos</h4>
            <p>
              <strong>
                Upload original photos of the {formData.category} to be rewarded
              </strong>
            </p>
          </div>
        </section>

        {/* SECTION 4: Single Action Button */}
        <div className={styles.footerAction}>
          <button type="submit" className={styles.btnMainCTA}>
            <PlusCircle size={22} /> Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default Accomodation;
