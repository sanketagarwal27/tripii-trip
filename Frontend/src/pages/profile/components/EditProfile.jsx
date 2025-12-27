import { useState } from "react";
import styles from "./EditProfile.module.css";

const EditProfileModal = ({ user, onClose, onSave }) => {
  // State
  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    bio: user.bio || "",
    address: user.address || "",
    privacy: user.privacy || false, // Privacy Setting
  });

  // Separate state for the file and its preview
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user.profilePicture.url);
  const [saving, setSaving] = useState(false);

  // Handle Text Inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Create a fake URL to show the image immediately
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Create FormData object (Required for file uploads)
    const dataToSend = new FormData();
    dataToSend.append("fullName", formData.fullName);
    dataToSend.append("bio", formData.bio);
    dataToSend.append("address", formData.address);
    dataToSend.append("privacy", formData.privacy);

    // Only append the file if the user picked a new one
    if (avatarFile) {
      dataToSend.append("profilePicture", avatarFile);
    }

    await onSave(dataToSend);
    setSaving(false);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalHeader}>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          {/* Avatar Upload Section */}
          <div className={styles.avatarUpload}>
            <label htmlFor="avatarInput">
              <img
                src={previewUrl}
                alt="Avatar Preview"
                className={styles.avatarPreview}
              />
            </label>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
            <label htmlFor="avatarInput" className={styles.uploadLabel}>
              Change Profile Photo
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className={styles.formTextarea}
            />
          </div>

          {/* Privacy Toggle */}
          <div className={styles.toggleContainer}>
            <div>
              <div className={styles.toggleLabel}>Private Account</div>
              <div className={styles.toggleDescription}>
                Only followers can see your posts
              </div>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                name="privacy"
                checked={formData.privacy}
                onChange={handleChange}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
