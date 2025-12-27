import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addPost } from "@/redux/postSlice";
import { createPost } from "@/api/post";
import { Image as ImageIcon, X as CloseIcon } from "lucide-react";
import { setUserProfile } from "@/redux/authslice";

const CreatePostBox = () => {
  const { userProfile } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // multiple files
  const [previews, setPreviews] = useState([]); // multiple preview URLs
  const [mainPreview, setMainPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef();

  /** -------------------------
   *  HANDLE MULTIPLE FILES
   * ------------------------- */
  const handleFile = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length === 0) return;

    const newPrev = selected.map((f) => URL.createObjectURL(f));

    setFiles((prev) => [...prev, ...selected]);
    setPreviews((prev) => [...prev, ...newPrev]);

    // set last selected as main preview
    setMainPreview(newPrev[newPrev.length - 1]);
  };

  /** -------------------------
   * REMOVE AN IMAGE
   * ------------------------- */
  const removeImage = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPrev = previews.filter((_, i) => i !== index);

    setFiles(updatedFiles);
    setPreviews(updatedPrev);

    // If removed image was main preview → update main preview
    if (previews[index] === mainPreview) {
      setMainPreview(updatedPrev[0] || null);
    }

    // If no images left → clear image input
    if (updatedFiles.length === 0) {
      inputRef.current.value = "";
    }
  };

  /** -------------------------
   *  SUBMIT POST
   * ------------------------- */
  const handlePost = async () => {
    if (!text.trim() && files.length === 0) return;

    setLoading(true);

    const fd = new FormData();
    fd.append("caption", text);

    // Append ALL images
    files.forEach((file) => fd.append("media", file));

    try {
      const res = await createPost(fd);
      const data = res.data.data;

      dispatch(addPost(data.post));
      dispatch(setUserProfile(data.updatedUser));

      // Reset
      setText("");
      setFiles([]);
      setPreviews([]);
      setMainPreview(null);
      inputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-box">
      {/* TOP: PROFILE + TEXTAREA */}
      <div className="create-post-top">
        <img
          src={userProfile.profilePicture.url || "/travel.jpg"}
          className="avatar"
        />
        <textarea
          placeholder="Create a new post..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* MAIN BIG PREVIEW */}
      {mainPreview && (
        <div className="main-preview-container">
          <img src={mainPreview} className="main-preview-image" />

          <button
            className="remove-main-btn"
            onClick={() => {
              const index = previews.indexOf(mainPreview);
              removeImage(index);
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>
      )}

      {/* THUMBNAIL ROW */}
      {previews.length > 0 && (
        <div className="thumbnail-row">
          {previews.map((src, index) => (
            <div className="thumbnail-wrapper" key={index}>
              <img
                src={src}
                className={`thumbnail-img ${
                  src === mainPreview ? "thumbnail-selected" : ""
                }`}
                onClick={() => setMainPreview(src)}
              />

              <button
                className="thumbnail-remove"
                onClick={() => removeImage(index)}
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="create-post-actions">
        {/* IMAGE UPLOAD */}
        <label className="image-upload-btn">
          <ImageIcon size={22} />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple // ← IMPORTANT
            onChange={handleFile}
          />
        </label>

        {/* POST BUTTON */}
        {(text.trim() || files.length > 0) && (
          <button className="post-btn" onClick={handlePost} disabled={loading}>
            {loading ? "Posting..." : "Post"}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreatePostBox;
