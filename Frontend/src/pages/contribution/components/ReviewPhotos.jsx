import { Camera, Loader2, X } from "lucide-react";
import styles from "./Forms.module.css";
import { useState } from "react";
import { uploadImages } from "@/api/contribution";

const ReviewPhotos = ({
  category,
  images,
  onImagesChange,
  setErrors,
  errors,
}) => {
  // States
  const [isUploading, setIsUploading] = useState(false);

  //Functions
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxPhotos = 5;
    const maxSizeMb = 5;
    const maxSize = 5 * 1024 * 1024;
    const currentCount = images.length;
    const newCount = files.length;

    if (currentCount + newCount > maxPhotos) {
      setErrors((prev) => ({
        ...prev,
        photos: `Can't upload more than ${maxPhotos} photos !`,
      }));
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    setErrors((prev) => ({ ...prev, photos: null }));
    const uploadData = new FormData();

    for (let i = 0; i < files.length; i++) {
      uploadData.append("photos", files[i]);
    }

    try {
      const response = await uploadImages(uploadData);
      if (response.success) {
        onImagesChange([...images, ...response.data]);
      } else {
        setErrors((prev) => ({ ...prev, photos: "Image Uploading Failed !" }));
      }
    } catch (err) {
      console.error("Error: ", err);
      setErrors((prev) => ({ ...prev, photos: "Error in Uploading image" }));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index) => {
    const updatedImages = images.filter((_, indx) => indx !== index);
    onImagesChange(updatedImages);
  };

  return (
    <div className={styles.inputGroup}>
      {/* Hidden Input */}
      <input
        type="file"
        multiple
        accept="image/*"
        id="review-photos"
        onChange={handleImageUpload}
        style={{ display: "none" }}
        disabled={isUploading}
      />

      <label
        htmlFor="review-photos"
        className={styles.uploadZone}
        style={{ cursor: isUploading ? "not-allowed" : "pointer" }}
      >
        <div className={styles.uploadIconCircle}>
          {isUploading ? (
            <Loader2 className={styles.spinner} size={32} />
          ) : (
            <Camera size={32} />
          )}
        </div>
        <h4>{isUploading ? "Uploading..." : "Add Photos"}</h4>
        <p>
          <strong>Upload original photos of {category} to be rewarded</strong>
        </p>
      </label>

      {/* Image Previews */}
      {images && images.length > 0 && (
        <div className={styles.imagePreviewGrid}>
          {images.map((url, index) => (
            <div key={index} className={styles.previewCard}>
              <img src={url} alt={`Preview ${index}`} />
              <button
                type="button"
                className={styles.removeImgBtn}
                onClick={() => removeImage(index)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {errors.photos && (
        <span
          className={styles.errorText}
          style={{
            color: "#e74c3c",
            fontSize: "0.85rem",
            marginTop: "0.5rem",
            display: "block",
          }}
        >
          {errors.photos}
        </span>
      )}
    </div>
  );
};

export default ReviewPhotos;
