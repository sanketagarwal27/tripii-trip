import styles from "./PhotoSection.module.css";

function PhotoSection({ photos }) {
  if (!photos || photos.length === 0) {
    return <h3 className={styles.noPhotos}>No Photos Available Yet</h3>;
  }
  return (
    <div className={styles.gallerySection}>
      <h2 className={styles.galleryHeader}>Gallery</h2>
      <div className={styles.grid}>
        {photos.map((photo, index) => (
          <div key={index} className={styles.photoCard}>
            <div className={styles.photoWrapper}>
              <img
                src={photo.small_url}
                alt={photo.alt_description}
                className={styles.image}
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PhotoSection;
