import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendMessage } from "@/api/community";
import GifPickerOverlay from "../common/GifPickerOverlay";

export default function CreatePostBox() {
  const profile = useSelector((s) => s.community.profile);
  const user = useSelector((s) => s.auth.user);

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [gifUrl, setGifUrl] = useState(null);

  const [showGifPicker, setShowGifPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- POLL ---------------- */
  const [isPoll, setIsPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  /* ---------------- CLEAR IMAGE ---------------- */
  const clearImage = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  /* ---------------- CLEAR GIF ---------------- */
  const clearGif = () => {
    setGifUrl(null);
  };

  /* ---------------- TOGGLE POLL ---------------- */
  const togglePoll = () => {
    if (isPoll) {
      setPollQuestion("");
      setPollOptions(["", ""]);
    }
    setIsPoll((p) => !p);
  };

  const submit = async () => {
    // POLL VALIDATION
    if (isPoll) {
      if (!pollQuestion.trim()) {
        alert("Poll question is required");
        return;
      }

      const validOptions = pollOptions.filter((o) => o.trim());
      if (validOptions.length < 2) {
        alert("Poll must have at least 2 options");
        return;
      }
    }

    if (!text.trim() && !file && !gifUrl && !isPoll) return;

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("content", text.trim());

      if (gifUrl) {
        fd.append("gifUrl", gifUrl);
      }

      if (file) {
        fd.append("media", file);
      }

      if (isPoll) {
        const validOptions = pollOptions.filter((o) => o.trim());
        fd.append(
          "poll",
          JSON.stringify({
            question: pollQuestion.trim(),
            options: validOptions,
            allowMultipleVotes: false,
            expiresInHours: 24,
          })
        );
      }

      await sendMessage(profile._id, fd);

      // reset
      setText("");
      setFile(null);
      setPreviewUrl(null);
      setGifUrl(null);
      setIsPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
    } catch (err) {
      console.error("Post error:", err);
      alert(err?.response?.data?.message || "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[rgb(250,250,250)] dark:bg-surface-dark rounded-xl border border-[rgba(0,0,0,0.4)] p-4 mt-3">
      <div className="flex gap-3">
        {/* AVATAR */}
        <div
          className="w-10 h-10 rounded-full bg-cover bg-center shrink-0"
          style={{
            backgroundImage: `url(${
              user?.profilePicture?.url || "/public/travel.jpg"
            })`,
          }}
        />

        <div className="flex-1 min-w-0">
          {/* TEXT */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write something..."
            className="w-full min-h-[44px] p-3 rounded-lg bg-background-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {/* POLL */}
          {isPoll && (
            <div className="mt-3 space-y-2 p-3 bg-background-light rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Create Poll</span>
                <button
                  onClick={togglePoll}
                  className="text-text-muted-light hover:text-text-light"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                </button>
              </div>

              <input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll question"
                className="w-full p-2 rounded border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 p-2 rounded border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => {
                        setPollOptions(
                          pollOptions.filter((_, idx) => idx !== i)
                        );
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  )}
                </div>
              ))}

              {pollOptions.length < 6 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-xs text-primary hover:underline"
                >
                  + Add option
                </button>
              )}
            </div>
          )}

          {/* IMAGE PREVIEW */}
          {previewUrl && (
            <div className="mt-3 relative inline-block">
              <img
                src={previewUrl}
                className="w-32 h-32 object-cover rounded-lg border"
                alt="Preview"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
          )}

          {/* GIF PREVIEW */}
          {gifUrl && (
            <div className="mt-3 relative inline-block">
              <img src={gifUrl} className="w-40 rounded-lg border" alt="GIF" />
              <button
                onClick={clearGif}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              {/* IMAGE - Only show if no poll/gif */}
              {!isPoll && !gifUrl && (
                <label className="p-2 rounded-lg hover:bg-border-light cursor-pointer transition">
                  <span className="material-symbols-outlined text-primary">
                    image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setFile(f);
                      setPreviewUrl(URL.createObjectURL(f));
                    }}
                  />
                </label>
              )}

              {/* GIF - Only show if no poll/image */}
              {!isPoll && !file && (
                <button
                  onClick={() => setShowGifPicker((s) => !s)}
                  className={`p-2 rounded-lg transition ${
                    showGifPicker
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-border-light"
                  }`}
                >
                  <span className="material-symbols-outlined text-primary">
                    gif_box
                  </span>
                </button>
              )}

              {/* POLL - Only show if no image/gif */}
              {!file && !gifUrl && (
                <button
                  onClick={togglePoll}
                  className={`p-2 rounded-lg transition ${
                    isPoll
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-border-light"
                  }`}
                >
                  <span className="material-symbols-outlined text-primary">
                    poll
                  </span>
                </button>
              )}
            </div>

            <button
              onClick={submit}
              disabled={loading}
              className="bg-primary text-white rounded-full px-4 py-2 font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
      {/* GIF picker */}
      {showGifPicker && !isPoll && (
        <GifPickerOverlay
          onSelect={(url) => {
            setGifUrl(url); // 🔥 preview stays
            setShowGifPicker(false);
          }}
          onClose={() => setShowGifPicker(false)}
        />
      )}
    </div>
  );
}
