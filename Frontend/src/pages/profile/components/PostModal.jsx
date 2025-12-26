import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./PostModal.module.css";

const PostModal = ({ post, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const mediaList = post?.media || [];
  const hasMultipleMedia = mediaList.length > 1;

  // --- HANDLERS ---
  const handleNext = (e) => {
    e?.stopPropagation();
    if (hasMultipleMedia) {
      setCurrentImageIndex((prev) => (prev + 1) % mediaList.length);
    }
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (hasMultipleMedia) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + mediaList.length) % mediaList.length
      );
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, hasMultipleMedia]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose}>
        <X size={32} />
      </button>

      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {hasMultipleMedia && (
          <button
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={handlePrev}
          >
            <ChevronLeft size={36} />
          </button>
        )}

        <div className={styles.imageContainer}>
          <img
            src={mediaList[currentImageIndex]?.url}
            alt={`Slide ${currentImageIndex + 1}`}
            className={styles.mainImage}
          />
        </div>

        {hasMultipleMedia && (
          <button
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={handleNext}
          >
            <ChevronRight size={36} />
          </button>
        )}
      </div>

      {/* --- CAPTION OVERLAY --- */}
      {(post?.caption || post?.author?.username) && (
        <div className={styles.captionOverlay}>
          <div
            className={styles.captionContent}
            onClick={(e) => e.stopPropagation()}
          >
            {post?.caption && (
              <p className={styles.captionText}>{post.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* Dots Indicator */}
      {hasMultipleMedia && (
        <div className={styles.dotsContainer}>
          {mediaList.map((_, idx) => (
            <span
              key={idx}
              className={`${styles.dot} ${
                idx === currentImageIndex ? styles.activeDot : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(idx);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostModal;
