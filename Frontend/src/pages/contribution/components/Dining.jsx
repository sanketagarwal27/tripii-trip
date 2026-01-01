import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Forms.module.css"; // Uses the same theme
import {
  ArrowLeft,
  MapPin,
  Camera,
  Star,
  PlusCircle,
  Utensils,
} from "lucide-react";
import { useContribution } from "@/context/ContributionContext";
import ReviewPhotos from "./ReviewPhotos";

const Dining = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [errors, setErrors] = useState({});
  const { tripMeta, addToTimeline, updateTimeline } = useContribution();
  const { editData } = location.state || {};

  const [formData, setFormData] = useState({
    placeName: editData?.placeName || "",
    category: editData?.category || "Restaurant", // restaurant, cafe, street_food, bar
    location: editData?.location || "",
    contactPerson: editData?.contactPerson || "",
    contactNumber: editData?.contactNumber || "",
    dateOfVisit: editData?.dateOfVisit || tripMeta.date || "",
    cuisine: editData?.cuisine || [],
    priceRange: editData?.priceRange || "2", // 1, 2, 3
    dietary: editData?.dietary || [],
    mustTry: editData?.mustTry || "", // Specific to food
    ambienceRating: editData?.ambienceRating || null,
    foodRating: editData?.foodRating || null,
    serviceRating: editData?.serviceRating || null,
    rating: editData?.rating || null,
    description: editData?.description || "",
    images: editData?.images || [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleList = (field, value) => {
    setFormData((prev) => {
      const list = prev[field];
      return {
        ...prev,
        [field]: list.includes(value)
          ? list.filter((i) => i !== value)
          : [...list, value],
      };
    });
  };

  const isEditing = !!editData;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.ambienceRating === null || formData.ambienceRating === 0) {
      setErrors((prev) => ({
        ...prev,
        ambienceRating: "Please provide a rating for the ambience.",
      }));
      return;
    }
    if (formData.foodRating === null || formData.foodRating === 0) {
      setErrors((prev) => ({
        ...prev,
        foodRating: "Please provide a rating for the food.",
      }));
      return;
    }
    if (formData.serviceRating === null || formData.serviceRating === 0) {
      setErrors((prev) => ({
        ...prev,
        serviceRating: "Please provide a rating for the service.",
      }));
      return;
    }
    if (formData.rating === null || formData.rating === 0) {
      setErrors((prev) => ({
        ...prev,
        rating: "Please provide an overall rating.",
      }));
      return;
    }
    if (isEditing) {
      updateTimeline(editData.id, { ...formData, type: "Food & Dining" });
      navigate(-1);
    } else {
      addToTimeline({
        ...formData,
        type: "Food & Dining",
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
        <h1>Add Dining Spot</h1>
      </header>

      <form className={styles.formWrapper} onSubmit={handleSubmit}>
        {/* BASICS */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>The Spot</h3>
          <div className={styles.inputGroup}>
            <label>Name of Restaurant / Cafe </label>
            <input
              type="text"
              name="placeName"
              value={formData.placeName}
              onChange={handleChange}
              placeholder="e.g. Joe's Pizza"
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
                <option value="Restaurant">Restaurant</option>
                <option value="Cafe">Cafe / Bakery</option>
                <option value="Street Food">Street Food</option>
                <option value="Bar">Bar / Pub</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Location</label>
              <div className={styles.iconInputWrapper}>
                <MapPin size={18} className={styles.inputIcon} />
                <input
                  placeholder={`Where in ${tripMeta.location} ?`}
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.hasIcon}`}
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.rowGrid}>
            <div className={styles.inputGroup}>
              <label>Person of Contact</label>
              <input
                type="text"
                name="contactPerson"
                placeholder="Name of some higher authority (optional)"
                value={formData.contactPerson}
                onChange={handleChange}
                className={`${styles.input}`}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Contact Number</label>
              <input
                type="text"
                name="contactNumber"
                placeholder="Contact Number (required)"
                value={formData.contactNumber}
                onChange={handleChange}
                className={`${styles.input}`}
                required
              />
            </div>
          </div>
        </section>

        {/* DETAILS */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>Food Details</h3>

          {/* Cuisine Pills */}
          <div className={styles.inputGroup}>
            <label>Cuisine (Select all that apply)</label>
            <div className={styles.pillContainer}>
              {[
                "Italian",
                "Asian",
                "Local/Regional",
                "Burgers",
                "Coffee",
                "Dessert",
                "Seafood",
              ].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.pill} ${
                    formData.cuisine.includes(c) ? styles.activePill : ""
                  }`}
                  onClick={() => toggleList("cuisine", c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.rowGrid}>
            {/* Price Range */}
            <div className={styles.inputGroup}>
              <label>Price Range</label>
              <div className={styles.priceToggle}>
                {["1", "2", "3"].map((p, idx) => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.priceBtn} ${
                      formData.priceRange === p ? styles.activePrice : ""
                    }`}
                    onClick={() => setFormData({ ...formData, priceRange: p })}
                  >
                    {/* Render $ signs */}
                    {Array(idx + 1)
                      .fill("$")
                      .join("")}
                  </button>
                ))}
              </div>
            </div>

            {/* Must Try Dish */}
            <div className={styles.inputGroup}>
              <label>Must Try Dish</label>
              <div className={styles.iconInputWrapper}>
                <Utensils size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  name="mustTry"
                  value={formData.mustTry}
                  onChange={handleChange}
                  placeholder="e.g. Truffle Pasta"
                  className={`${styles.input} ${styles.hasIcon}`}
                />
              </div>
            </div>
          </div>

          {/* Dietary Options */}
          <div className={styles.inputGroup}>
            <label>Dietary Friendly?</label>
            <div className={styles.amenitiesGrid}>
              {["Vegetarian", "Vegan", "Gluten Free"].map((d) => (
                <div
                  key={d}
                  className={`${styles.amenityCard} ${
                    formData.dietary.includes(d) ? styles.activeAmenity : ""
                  }`}
                  onClick={() => toggleList("dietary", d)}
                >
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEW (Reusing standard inputs) */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>Your Experience</h3>
          <div className={styles.inputGroup}>
            <label>Food Rating</label>
            <div className={styles.starRatingWrapper}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={36}
                  fill={star <= (formData.foodRating || 0) ? "#fbbd08" : "none"}
                  color={
                    star <= (formData.foodRating || 0) ? "#fbbd08" : "#e0e0e0"
                  }
                  className={styles.starBtn}
                  onClick={() => {
                    setFormData({ ...formData, foodRating: star });
                    if (errors.foodRating)
                      setErrors((prev) => ({ ...prev, foodRating: null }));
                  }}
                />
              ))}
            </div>
            {errors.foodRating && (
              <span
                className={styles.errorText}
                style={{
                  color: "#e74c3c",
                  fontSize: "0.85rem",
                  marginTop: "0.5rem",
                  display: "block",
                }}
              >
                {errors.foodRating}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Ambience Rating</label>
            <div className={styles.starRatingWrapper}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={36}
                  fill={
                    star <= (formData.ambienceRating || 0) ? "#fbbd08" : "none"
                  }
                  color={
                    star <= (formData.ambienceRating || 0)
                      ? "#fbbd08"
                      : "#e0e0e0"
                  }
                  className={styles.starBtn}
                  onClick={() => {
                    setFormData({ ...formData, ambienceRating: star });
                    if (errors.ambienceRating)
                      setErrors((prev) => ({ ...prev, ambienceRating: null }));
                  }}
                />
              ))}
            </div>
            {errors.ambienceRating && (
              <span
                className={styles.errorText}
                style={{
                  color: "#e74c3c",
                  fontSize: "0.85rem",
                  marginTop: "0.5rem",
                  display: "block",
                }}
              >
                {errors.ambienceRating}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Service Rating</label>
            <div className={styles.starRatingWrapper}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={36}
                  fill={
                    star <= (formData.serviceRating || 0) ? "#fbbd08" : "none"
                  }
                  color={
                    star <= (formData.serviceRating || 0)
                      ? "#fbbd08"
                      : "#e0e0e0"
                  }
                  className={styles.starBtn}
                  onClick={() => {
                    setFormData({ ...formData, serviceRating: star });
                    if (errors.serviceRating)
                      setErrors((prev) => ({ ...prev, serviceRating: null }));
                  }}
                />
              ))}
            </div>
            {errors.serviceRating && (
              <span
                className={styles.errorText}
                style={{
                  color: "#e74c3c",
                  fontSize: "0.85rem",
                  marginTop: "0.5rem",
                  display: "block",
                }}
              >
                {errors.serviceRating}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Overall Rating</label>
            <div className={styles.starRatingWrapper}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={36}
                  fill={star <= (formData.rating || 0) ? "#fbbd08" : "none"}
                  color={star <= (formData.rating || 0) ? "#fbbd08" : "#e0e0e0"}
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
            <label>Review</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Explain how did you liked the overall decorum of the place"
              rows={4}
              className={styles.textarea}
            />
          </div>
          <ReviewPhotos
            category={formData.category}
            images={formData.images}
            onImagesChange={(newImages) =>
              setFormData((prev) => ({ ...prev, images: newImages }))
            }
            setErrors={setErrors}
            errors={errors}
          />
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

export default Dining;
