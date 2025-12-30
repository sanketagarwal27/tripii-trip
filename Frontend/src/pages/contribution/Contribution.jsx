import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Contribution.module.css";
import { useContribution } from "../../context/ContributionContext";
import {
  BedDouble,
  Utensils,
  MapPin,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Navigation,
  Calendar,
  Loader2,
} from "lucide-react";
import { newContribution } from "@/api/contribution";

const Contribution = () => {
  const navigate = useNavigate();
  const locationInputRef = useRef(null);
  const dateInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const { tripMeta, updateMeta, timeline, removeFromTimeline, clearSession } =
    useContribution();

  const handleSelection = (type) => {
    if (!tripMeta.location.trim()) {
      locationInputRef.current.focus();
      locationInputRef.current.classList.add(styles.shake);
      setTimeout(
        () => locationInputRef.current.classList.remove(styles.shake),
        500
      );
      return;
    }
    if (!tripMeta.date.trim()) {
      dateInputRef.current.focus();
      dateInputRef.current.classList.add(styles.shake);
      setTimeout(
        () => dateInputRef.current.classList.remove(styles.shake),
        500
      );
      return;
    }
    navigate(`/contribute/add-${type}`);
  };

  const handleEdit = (id) => {
    const item = timeline.find((item) => item.id === id);

    if (!item) return;
    const route =
      item.type === "Accommodation"
        ? "accommodation"
        : item.type === "Food & Dining"
        ? "dining"
        : "spot";
    navigate(`/contribute/add-${route}`, {
      state: {
        editData: item,
      },
    });
  };

  const handleDelete = (id) => {
    removeFromTimeline(id);
  };

  const handleSubmit = async () => {
    if (timeline.length === 0) return;
    setSubmitting(true);
    try {
      const response = await newContribution(timeline, tripMeta);
      if (response.success) {
        clearSession();
      }
    } catch (err) {
      console.error("Error: ", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1>Share your experience and get rewarded</h1>
          <p>Build a timeline of your recent trip to help others.</p>
        </div>

        <div className={styles.tripContextCard}>
          <div className={styles.inputGroup}>
            <label>
              <Navigation size={18} className={styles.inputIcon} />
              Where did you go?
            </label>
            <input
              ref={locationInputRef}
              type="text"
              placeholder="e.g. Kyoto, Japan"
              value={tripMeta.location}
              onChange={(e) => updateMeta(e.target.value, tripMeta.date)}
              className={styles.mainInput}
            />
          </div>
          <div className={styles.divider}></div>
          <div className={styles.inputGroup}>
            <label>
              <Calendar size={18} className={styles.inputIcon} />
              When?
            </label>
            <input
              ref={dateInputRef}
              type="date" // Changed from 'month' to 'date' to match your previous code
              value={tripMeta.date}
              onChange={(e) => updateMeta(tripMeta.location, e.target.value)}
              className={styles.dateInput}
              required
            />
          </div>
        </div>
      </header>

      <div className={styles.layoutSplit}>
        {/* LEFT SIDE: SELECTION */}
        <main className={styles.selectionSection}>
          <h2 className={styles.sectionTitle}>
            {tripMeta.location
              ? `Add to ${tripMeta.location}`
              : "Select a category"}
          </h2>

          <div className={styles.gridContainer}>
            <div
              className={styles.card}
              onClick={() => handleSelection("accommodation")}
            >
              <div className={`${styles.iconWrapper} ${styles.blue}`}>
                <BedDouble size={32} />
              </div>
              <div className={styles.cardContent}>
                <h3>Accommodation</h3>
                <span className={styles.actionLink}>
                  Add Stay <PlusCircle size={16} />
                </span>
              </div>
            </div>

            <div
              className={styles.card}
              onClick={() => handleSelection("dining")}
            >
              <div className={`${styles.iconWrapper} ${styles.orange}`}>
                <Utensils size={32} />
              </div>
              <div className={styles.cardContent}>
                <h3>Food & Dining</h3>
                <span className={styles.actionLink}>
                  Add Food <PlusCircle size={16} />
                </span>
              </div>
            </div>

            <div
              className={styles.card}
              onClick={() => handleSelection("spot")}
            >
              <div className={`${styles.iconWrapper} ${styles.green}`}>
                <MapPin size={32} />
              </div>
              <div className={styles.cardContent}>
                <h3>Tourist Spot</h3>
                <span className={styles.actionLink}>
                  Add Spot <PlusCircle size={16} />
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT SIDE: TIMELINE */}
        <aside className={styles.timelineSection}>
          <div className={styles.timelineHeader}>
            <h3>
              Trip Timeline
              {tripMeta.location && (
                <span className={styles.locationTag}>{tripMeta.location}</span>
              )}
            </h3>
            <span className={styles.badge}>{timeline.length}</span>
          </div>

          <div className={styles.timelineList}>
            {timeline.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Select the place you want to review first !</p>
              </div>
            ) : (
              timeline.map((place, index) => (
                <div key={place.id} className={styles.timelineItem}>
                  <div className={styles.timelineLine}>
                    <div className={styles.timelineDot}>
                      <CheckCircle2 size={14} color="white" />
                    </div>
                    {index !== timeline.length - 1 && (
                      <div className={styles.lineConnector}></div>
                    )}
                  </div>

                  <div className={styles.timelineCard}>
                    <div className={styles.timelineCardHeader}>
                      <span className={styles.typeTag}>{place.type}</span>

                      <div className={styles.actionGroup}>
                        <button
                          onClick={() => handleEdit(place.id)}
                          className={styles.editBtn}
                          aria-label="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(place.id)}
                          className={styles.deleteBtn}
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h4>{place.placeName || place.name}</h4>
                  </div>
                </div>
              ))
            )}
            {timeline.length > 0 && (
              <button
                className={styles.submitBatchBtn}
                onClick={handleSubmit}
                disabled={submitting} // Disable while loading
              >
                {submitting ? (
                  <span className={styles.loaderContent}>
                    <Loader2 className={styles.spinner} size={20} />
                    Submitting...
                  </span>
                ) : (
                  "Submit All"
                )}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Contribution;
