import { useState, useRef } from "react";
import { ThumbsUp, Trash2, Image, SmilePlus, X } from "lucide-react";
import { createComment, deleteComment, reactOnComment } from "@/api/community";
import { useSelector } from "react-redux";
import GifPickerOverlay from "@/components/common/GifPickerOverlay";
import EmojiPickerPopover from "@/components/common/EmojiPickerPopover";
import toast from "react-hot-toast";

const CommentItem = ({
  comment,
  allComments,
  messageAuthorId,
  userId,
  timeAgo,
  depth = 0,
}) => {
  const userProfile = useSelector((s) => s.auth.userProfile);

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyGif, setReplyGif] = useState(null);
  const [replyImage, setReplyImage] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const replies = allComments.filter((c) => c.parentComment === comment._id);

  const canDelete =
    userId === comment.author._id ||
    userId === messageAuthorId ||
    comment.author._id === userId;

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReplyImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setReplyImagePreview(reader.result);
    reader.readAsDataURL(file);
    setReplyGif(null);
  };

  const clearReplyImage = () => {
    setReplyImage(null);
    setReplyImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearReplyGif = () => {
    setReplyGif(null);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() && !replyGif && !replyImage) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      if (replyText.trim()) form.append("content", replyText);
      if (replyGif) form.append("gifUrl", replyGif);
      if (replyImage) form.append("media", replyImage);
      form.append("parentCommentId", comment._id);

      await createComment(comment.message, form);

      setReplyText("");
      setReplyGif(null);
      clearReplyImage();
      setShowReplyBox(false);
      setShowReplies(true);
      toast.success("Reply added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add reply");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteComment(comment._id);
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };

  const handleReact = async (emoji) => {
    try {
      await reactOnComment(comment._id, emoji);
      setShowReactionPicker(false);
    } catch (err) {
      toast.error("Failed to react");
    }
  };

  const groupedReactions = (comment.reactions || []).reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r.by);
    return acc;
  }, {});

  const hasUserReacted = (emoji) => {
    return groupedReactions[emoji]?.some((id) => id === userId);
  };

  return (
    <div
      className={`flex flex-col transition-all duration-300 ${
        comment._remove ? "opacity-0 translate-x-4" : ""
      }`}
    >
      <div className="flex w-full gap-3 p-4 rounded-lg">
        <img
          src={comment.author.profilePicture?.url || "/travel.jpg"}
          className="size-10 rounded-full object-cover mt-1"
          alt={`${comment.author.username}'s profile`}
        />

        <div className="flex flex-col flex-1">
          <div className="flex justify-between items-start">
            <div className="flex items-baseline gap-2">
              <p className="font-semibold text-sm">{comment.author.username}</p>
              <p className="text-xs text-gray-500">
                {timeAgo(comment.createdAt)}
              </p>
            </div>

            {canDelete && (
              <Trash2
                size={16}
                className="text-gray-500 cursor-pointer hover:text-red-600 transition"
                onClick={handleDelete}
              />
            )}
          </div>

          {comment.content && <p className="text-sm mt-1">{comment.content}</p>}

          {comment.media?.url && (
            <img
              src={comment.media.url}
              className="mt-2 rounded-lg max-h-[300px] object-contain"
              alt="Comment media"
            />
          )}

          {Object.keys(groupedReactions).length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {Object.entries(groupedReactions).map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
                    hasUserReacted(emoji)
                      ? "bg-primary/20 border border-primary"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-gray-600">{users.length}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            {comment.depth < 3 && (
              <button
                onClick={() => setShowReplyBox((s) => !s)}
                className="text-xs font-semibold text-gray-500 hover:text-primary transition"
              >
                REPLY
              </button>
            )}

            <button
              onClick={() => setShowReactionPicker((s) => !s)}
              className="text-xs font-semibold text-gray-500 hover:text-primary transition relative"
            >
              REACT
            </button>

            {showReactionPicker && (
              <div className="absolute z-10 mt-2">
                <EmojiPickerPopover onSelect={(emoji) => handleReact(emoji)} />
              </div>
            )}
          </div>

          {showReplyBox && (
            <div className="mt-3 ml-0">
              <p className="text-xs text-gray-500 mb-2">
                Replying to{" "}
                <span className="font-semibold">{comment.author.username}</span>
              </p>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
                rows={2}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                placeholder="Write a reply..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply();
                  }
                }}
              />

              {replyGif && (
                <div className="relative mt-2">
                  <img
                    src={replyGif}
                    className="rounded-lg max-h-32 object-contain"
                    alt="Reply GIF"
                  />
                  <button
                    onClick={clearReplyGif}
                    className="absolute top-2 right-2 bg-black/60 p-1 rounded-full hover:bg-black/80"
                  >
                    <X size={14} color="white" />
                  </button>
                </div>
              )}

              {replyImagePreview && (
                <div className="relative mt-2">
                  <img
                    src={replyImagePreview}
                    className="rounded-lg max-h-32 object-contain"
                    alt="Reply image preview"
                  />
                  <button
                    onClick={clearReplyImage}
                    className="absolute top-2 right-2 bg-black/60 p-1 rounded-full hover:bg-black/80"
                  >
                    <X size={14} color="white" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-600 hover:text-primary transition"
                    title="Add image"
                  >
                    <Image size={18} />
                  </button>

                  <button
                    onClick={() => setShowEmojiPicker((s) => !s)}
                    className="text-gray-600 hover:text-primary transition"
                    title="Add emoji"
                  >
                    <SmilePlus size={18} />
                  </button>

                  <button
                    onClick={() => setShowGifPicker(true)}
                    className="text-xs font-semibold text-gray-600 hover:text-primary transition"
                  >
                    GIF
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setReplyText("");
                      setReplyGif(null);
                      clearReplyImage();
                      setShowReplyBox(false);
                    }}
                    className="text-xs text-gray-500 hover:text-primary font-semibold transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSubmitReply}
                    disabled={
                      loading || (!replyText.trim() && !replyGif && !replyImage)
                    }
                    className="text-xs font-bold text-white bg-primary px-3 py-1 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {showEmojiPicker && (
                <div className="relative mt-2">
                  <EmojiPickerPopover
                    onSelect={(e) => {
                      setReplyText((t) => t + e);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}

              {showGifPicker && (
                <GifPickerOverlay
                  onSelect={(url) => {
                    setReplyGif(url);
                    clearReplyImage();
                    setShowGifPicker(false);
                  }}
                  onClose={() => setShowGifPicker(false)}
                />
              )}
            </div>
          )}

          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies((p) => !p)}
              className="text-xs font-semibold text-gray-500 hover:text-primary mt-2 ml-1 transition"
            >
              {showReplies
                ? "Hide replies"
                : `View ${replies.length} ${
                    replies.length === 1 ? "reply" : "replies"
                  }`}
            </button>
          )}
        </div>
      </div>

      {showReplies &&
        replies.map((r, idx) => {
          const isLast = idx === replies.length - 1;

          return (
            <div
              key={r._id}
              className="relative flex gap-4 p-2 pl-8 ml-14 border-l border-gray-300"
            >
              {isLast && (
                <div className="absolute -bottom-3 left-0 w-4 h-4 border-l border-b border-gray-300 rounded-bl-xl" />
              )}

              <CommentItem
                comment={r}
                allComments={allComments}
                messageAuthorId={messageAuthorId}
                userId={userId}
                timeAgo={timeAgo}
                depth={depth + 1}
              />
            </div>
          );
        })}
    </div>
  );
};

export default CommentItem;
