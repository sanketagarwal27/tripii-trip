// src/components/community/comments/CommentInput.jsx
import { useState, useRef } from "react";
import { Image, SmilePlus, X } from "lucide-react";
import { createComment } from "@/api/community";
import GifPickerOverlay from "@/components/common/GifPickerOverlay";
import EmojiPickerPopover from "@/components/common/EmojiPickerPopover";
import toast from "react-hot-toast";

const CommentInput = ({ messageId, userProfile }) => {
  const [text, setText] = useState("");
  const [gif, setGif] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setGif(null);
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearGif = () => {
    setGif(null);
  };

  const submit = async () => {
    if (!text.trim() && !gif && !image) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      if (text.trim()) form.append("content", text);
      if (gif) form.append("gifUrl", gif);
      if (image) form.append("media", image);

      // 🔥 FIX: Don't call onNewComment - let socket handle it
      await createComment(messageId, form);

      // Reset form
      setText("");
      setGif(null);
      clearImage();
      toast.success("Comment added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start p-4 gap-4 bg-white rounded-xl shadow-sm mb-4">
      <img
        src={userProfile?.profilePicture?.url || "/travel.jpg"}
        className="size-10 rounded-full object-cover"
        alt="Your profile"
      />

      <div className="flex-1">
        <textarea
          placeholder="Share your thoughts..."
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="w-full p-3 rounded-lg border bg-background-light resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* PREVIEW GIF */}
        {gif && (
          <div className="relative mt-2">
            <img
              src={gif}
              className="rounded-lg max-h-40 object-contain"
              alt="GIF preview"
            />
            <button
              onClick={clearGif}
              className="absolute top-2 right-2 bg-black/60 p-1 rounded-full hover:bg-black/80"
            >
              <X size={16} color="white" />
            </button>
          </div>
        )}

        {/* PREVIEW IMAGE */}
        {imagePreview && (
          <div className="relative mt-2">
            <img
              src={imagePreview}
              className="rounded-lg max-h-40 object-contain"
              alt="Image preview"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 bg-black/60 p-1 rounded-full hover:bg-black/80"
            >
              <X size={16} color="white" />
            </button>
          </div>
        )}

        {/* TOOLBAR */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-600 hover:text-primary transition"
              title="Add image"
            >
              <Image size={20} />
            </button>

            <button
              onClick={() => setShowEmoji((s) => !s)}
              className="text-gray-600 hover:text-primary transition"
              title="Add emoji"
            >
              <SmilePlus size={20} />
            </button>

            <button
              onClick={() => setShowGif(true)}
              className="text-sm font-semibold text-gray-600 hover:text-primary transition"
            >
              GIF
            </button>
          </div>

          <button
            disabled={loading || (!text.trim() && !gif && !image)}
            onClick={submit}
            className="min-w-[84px] px-4 bg-primary text-black rounded-lg h-9 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {showEmoji && (
          <div className="relative mt-2">
            <EmojiPickerPopover
              onSelect={(e) => {
                setText((t) => t + e);
                setShowEmoji(false);
              }}
            />
          </div>
        )}

        {showGif && (
          <GifPickerOverlay
            onSelect={(url) => {
              setGif(url);
              clearImage();
              setShowGif(false);
            }}
            onClose={() => setShowGif(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CommentInput;
