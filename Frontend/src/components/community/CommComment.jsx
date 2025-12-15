import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Smile, Trash2, Image, Loader2 } from "lucide-react";
import {
  getMessageComments,
  createComment,
  deleteComment,
  reactOnComment,
} from "@/api/community";
import toast from "react-hot-toast";
import EmojiPickerPopover from "../common/EmojiPickerPopover";
import GifPickerOverlay from "../common/GifPickerOverlay";
import {
  setSelectedMessage,
  updateCommunityMessage,
} from "@/redux/communitySlice";

/* -------------------------------------------------
 * TIME AGO FORMATTER
 * ------------------------------------------------- */
const timeAgo = (timestamp) => {
  const diff = (Date.now() - new Date(timestamp)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/* -------------------------------------------------
 * BUILD NESTED COMMENT TREE
 * ------------------------------------------------- */
const buildCommentTree = (flatComments) => {
  const commentMap = {};
  const topLevel = [];

  flatComments.forEach((c) => {
    commentMap[c._id] = { ...c, replies: [] };
  });

  flatComments.forEach((c) => {
    if (c.parentComment) {
      const parent = commentMap[c.parentComment];
      if (parent) {
        parent.replies.push(commentMap[c._id]);
      }
    } else {
      topLevel.push(commentMap[c._id]);
    }
  });

  return topLevel;
};

/* -------------------------------------------------
 * MAIN COMMENT PAGE
 * ------------------------------------------------- */
const CommComment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: messageIdFromUrl } = useParams();

  // 🔥 Get from Redux - synced with socket
  const messages = useSelector((s) => s.community.messages || []);
  const selectedCommunity = useSelector((s) => s.community.selectedCommunity);
  const userProfile = useSelector((s) => s.auth.user);
  let selectedMessage = useSelector((s) => s.community.selectedMessage);

  // 🔥 Fallback: Find message from messages array if not in selectedMessage
  if (!selectedMessage && messageIdFromUrl) {
    selectedMessage = messages.find((m) => m._id === messageIdFromUrl);
  }

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [activeReplyBox, setActiveReplyBox] = useState(null);

  // Media states for main input
  const [mainImage, setMainImage] = useState(null);
  const [mainGif, setMainGif] = useState(null);
  const [showMainGifPicker, setShowMainGifPicker] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const mainFileInputRef = useRef(null);

  // Media states for reply input
  const [replyImage, setReplyImage] = useState(null);
  const [replyGif, setReplyGif] = useState(null);
  const [showReplyGifPicker, setShowReplyGifPicker] = useState(false);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const replyFileInputRef = useRef(null);

  /* LOAD COMMENTS ON MOUNT */
  useEffect(() => {
    const loadComments = async () => {
      if (!selectedMessage?._id) return;

      try {
        setLoading(true);
        const res = await getMessageComments(selectedMessage._id);
        const fetched = res.data.data.comments || [];

        console.log("📥 Loaded comments from API:", fetched.length);

        // 🔥 Update selectedMessage with comments
        const updatedMessage = {
          ...selectedMessage,
          comments: fetched,
        };

        dispatch(setSelectedMessage(updatedMessage));

        // 🔥 Also update in messages array if exists
        const msgInArray = messages.find((m) => m._id === selectedMessage._id);
        if (msgInArray) {
          dispatch(
            updateCommunityMessage({
              _id: selectedMessage._id,
              comments: fetched,
            })
          );
        }

        console.log("✅ Comments loaded and dispatched to Redux");
      } catch (err) {
        console.error("Failed to load comments:", err);
        toast.error("Failed to load comments");
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [selectedMessage?._id]);

  // 🔥 Get latest message data from Redux (includes real-time socket updates)
  const latestMessage = useMemo(() => {
    const fromMessages = messages.find((m) => m._id === selectedMessage?._id);

    // If found in messages, use that (it has socket updates)
    if (fromMessages) {
      console.log(
        "📊 Using message from messages array, comments:",
        fromMessages.comments?.length || 0
      );
      return fromMessages;
    }

    // Otherwise use selectedMessage
    console.log(
      "📊 Using selectedMessage, comments:",
      selectedMessage?.comments?.length || 0
    );
    return selectedMessage;
  }, [messages, selectedMessage]);

  // 🔥 Build nested tree from Redux comments (auto-updates with socket)
  const comments = useMemo(() => {
    const flatComments = latestMessage?.comments || [];
    return buildCommentTree(flatComments);
  }, [latestMessage?.comments]);

  /* MAIN IMAGE HANDLING */
  const handleMainImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setMainImage(file);
    setMainGif(null);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const clearMainMedia = () => {
    setMainImage(null);
    setMainGif(null);
    setMainImagePreview(null);
    if (mainFileInputRef.current) mainFileInputRef.current.value = "";
  };

  /* REPLY IMAGE HANDLING */
  const handleReplyImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setReplyImage(file);
    setReplyGif(null);
    setReplyImagePreview(URL.createObjectURL(file));
  };

  const clearReplyMedia = () => {
    setReplyImage(null);
    setReplyGif(null);
    setReplyImagePreview(null);
    if (replyFileInputRef.current) replyFileInputRef.current.value = "";
  };

  /* ADD COMMENT */
  const handleSubmitMain = async () => {
    if (!text.trim() && !mainImage && !mainGif) {
      toast.error("Please add some content");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", text.trim());
      formData.append("parentCommentId", "");

      if (mainImage) {
        formData.append("media", mainImage);
      } else if (mainGif) {
        formData.append("gifUrl", mainGif);
      }

      await createComment(selectedMessage._id, formData);

      setText("");
      clearMainMedia();
      toast.success("Comment added");
    } catch (err) {
      console.error("Failed to comment:", err);
      toast.error("Failed to add comment");
    }
  };

  /* ADD REPLY */
  const handleSubmitReply = async (parentId, depth) => {
    if (!replyText.trim() && !replyImage && !replyGif) {
      toast.error("Please add some content");
      return;
    }

    if (depth >= 3) {
      toast.error("Maximum comment depth reached");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", replyText.trim());
      formData.append("parentCommentId", parentId);

      if (replyImage) {
        formData.append("media", replyImage);
      } else if (replyGif) {
        formData.append("gifUrl", replyGif);
      }

      await createComment(selectedMessage._id, formData);

      setReplyText("");
      clearReplyMedia();
      setActiveReplyBox(null);
      toast.success("Reply added");
    } catch (err) {
      console.error("Failed to reply:", err);
      toast.error("Failed to add reply");
    }
  };

  /* DELETE COMMENT */
  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteComment(commentId);
      toast.success("Comment deleted");
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Failed to delete comment");
    }
  };

  /* REACT TO COMMENT */
  const handleReact = async (commentId, emoji) => {
    try {
      await reactOnComment(commentId, emoji);
    } catch (err) {
      console.error("Failed to react:", err);
      toast.error("Failed to add reaction");
    }
  };

  if (!selectedMessage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">No message selected</p>
      </div>
    );
  }

  const avatar =
    selectedMessage.sender?.profilePicture?.url || "/public/travel.jpg";

  const isMessageAuthor = selectedMessage.sender?._id === userProfile?._id;
  const isModerator = selectedCommunity?.moderators?.some(
    (mod) => mod === userProfile?._id || mod?._id === userProfile?._id
  );
  const isAdmin =
    selectedCommunity?.admin === userProfile?._id ||
    selectedCommunity?.admin?._id === userProfile?._id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-darker">
      <div className="mx-auto max-w-4xl pt-20 pb-8 px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex mb-4 items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary transition"
        >
          <ChevronLeft size={20} /> Back to Community
        </button>

        {/* MESSAGE */}
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm mb-4 p-6">
          <div className="flex gap-4 items-start mb-3">
            <div
              className="w-10 h-10 rounded-full bg-cover bg-center shrink-0"
              style={{ backgroundImage: `url(${avatar})` }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-text-light">
                  {selectedMessage.sender?.username ||
                    selectedMessage.senderDisplayName ||
                    "Unknown"}
                </p>
                <span className="text-xs text-text-muted-light">•</span>
                <p className="text-xs text-text-muted-light">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>

              {selectedMessage.content && (
                <p className="text-text-light leading-relaxed">
                  {selectedMessage.content}
                </p>
              )}

              {selectedMessage.media?.url && (
                <div className="mt-3 rounded-lg overflow-hidden border border-border-light">
                  <img
                    src={selectedMessage.media.url}
                    alt=""
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN INPUT */}
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm mb-4 p-4">
          <div className="flex items-start gap-4">
            <img
              src={userProfile?.profilePicture?.url || "/public/travel.jpg"}
              className="size-10 rounded-full object-cover shrink-0"
              alt=""
            />

            <div className="flex-1">
              <textarea
                placeholder="Share your thoughts..."
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-3 rounded-lg border border-border-light bg-background-light dark:bg-surface-darker resize-none focus:outline-none focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitMain();
                  }
                }}
              />

              {/* MEDIA PREVIEW */}
              {(mainImagePreview || mainGif) && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={mainImagePreview || mainGif}
                    alt="Preview"
                    className="max-h-40 rounded-lg border border-border-light"
                  />
                  <button
                    onClick={clearMainMedia}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex items-center gap-3 mt-2">
                <input
                  ref={mainFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => mainFileInputRef.current?.click()}
                  className="text-gray-500 hover:text-primary transition"
                  title="Add image"
                >
                  <Image size={20} />
                </button>

                <button
                  onClick={() => setShowMainGifPicker(true)}
                  className="text-xs font-semibold text-gray-500 hover:text-primary transition"
                >
                  GIF
                </button>

                <div className="flex-1" />

                <button
                  onClick={handleSubmitMain}
                  disabled={!text.trim() && !mainImage && !mainGif}
                  className="px-6 bg-primary text-white rounded-lg h-9 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COMMENTS LIST */}
        <div className="p-4 bg-white dark:bg-surface-dark rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-text-light mb-4">
            Comments ({latestMessage?.commentCount || 0})
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Be the first to comment ✨
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <CommentItem
                  key={c._id}
                  comment={c}
                  userId={userProfile?._id}
                  isMessageAuthor={isMessageAuthor}
                  isModerator={isModerator}
                  isAdmin={isAdmin}
                  handleDelete={handleDelete}
                  handleReact={handleReact}
                  timeAgo={timeAgo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  activeReplyBox={activeReplyBox}
                  setActiveReplyBox={setActiveReplyBox}
                  handleSubmitReply={handleSubmitReply}
                  replyImage={replyImage}
                  setReplyImage={setReplyImage}
                  replyGif={replyGif}
                  setReplyGif={setReplyGif}
                  replyImagePreview={replyImagePreview}
                  setReplyImagePreview={setReplyImagePreview}
                  replyFileInputRef={replyFileInputRef}
                  handleReplyImageSelect={handleReplyImageSelect}
                  clearReplyMedia={clearReplyMedia}
                  showReplyGifPicker={showReplyGifPicker}
                  setShowReplyGifPicker={setShowReplyGifPicker}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GIF PICKERS */}
      {showMainGifPicker && (
        <GifPickerOverlay
          onSelect={(url) => {
            setMainGif(url);
            setMainImage(null);
            setMainImagePreview(null);
            setShowMainGifPicker(false);
          }}
          onClose={() => setShowMainGifPicker(false)}
        />
      )}

      {showReplyGifPicker && (
        <GifPickerOverlay
          onSelect={(url) => {
            setReplyGif(url);
            setReplyImage(null);
            setReplyImagePreview(null);
            setShowReplyGifPicker(false);
          }}
          onClose={() => setShowReplyGifPicker(false)}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------
 * COMMENT ITEM COMPONENT
 * ------------------------------------------------- */
const CommentItem = ({
  comment,
  userId,
  isMessageAuthor,
  isModerator,
  isAdmin,
  handleDelete,
  handleReact,
  timeAgo,
  replyText,
  setReplyText,
  activeReplyBox,
  setActiveReplyBox,
  handleSubmitReply,
  replyImage,
  setReplyImage,
  replyGif,
  setReplyGif,
  replyImagePreview,
  setReplyImagePreview,
  replyFileInputRef,
  handleReplyImageSelect,
  clearReplyMedia,
  showReplyGifPicker,
  setShowReplyGifPicker,
  depth = 1,
}) => {
  const [showReplies, setShowReplies] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isAuthor = userId === comment.author._id;
  const canDelete = isAuthor || isMessageAuthor || isModerator || isAdmin;

  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < 3;

  // Group reactions by emoji
  const groupedReactions = (comment.reactions || []).reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r.by);
    return acc;
  }, {});

  const hasUserReacted = (emoji) => {
    return groupedReactions[emoji]?.some((id) => id === userId);
  };

  return (
    <div className="flex flex-col">
      <div className="flex w-full gap-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-surface-darker transition">
        <img
          src={comment.author.profilePicture?.url || "/public/travel.jpg"}
          className="size-10 rounded-full object-cover mt-1 shrink-0"
          alt=""
        />

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="font-semibold text-sm text-text-light">
                {comment.author.username}
              </p>
              <p className="text-xs text-text-muted-light">
                {timeAgo(comment.createdAt)}
              </p>
            </div>

            {canDelete && (
              <Trash2
                size={16}
                className="text-gray-500 cursor-pointer hover:text-red-500 transition shrink-0"
                onClick={() => handleDelete(comment._id)}
              />
            )}
          </div>

          <p className="text-sm mt-1 text-text-light break-words">
            {comment.content}
          </p>

          {comment.media?.url && (
            <div className="mt-2 rounded-lg overflow-hidden border border-border-light max-w-md">
              <img
                src={comment.media.url}
                alt=""
                className="w-full h-auto object-contain"
              />
            </div>
          )}

          {/* REACTIONS DISPLAY */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(groupedReactions).map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(comment._id, emoji)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
                    hasUserReacted(emoji)
                      ? "bg-primary/20 border border-primary"
                      : "bg-gray-100 dark:bg-surface-darker border border-border-light hover:bg-gray-200 dark:hover:bg-surface-dark"
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-text-muted-light">{users.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center gap-4 pt-2 flex-wrap relative">
            {canReply && (
              <button
                onClick={() =>
                  setActiveReplyBox(
                    activeReplyBox === comment._id ? null : comment._id
                  )
                }
                className="text-xs font-semibold text-gray-500 hover:text-primary transition"
              >
                REPLY
              </button>
            )}

            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-xs font-semibold text-gray-500 hover:text-primary transition flex items-center gap-1"
            >
              <Smile size={16} />
              REACT
            </button>

            {showEmojiPicker && (
              <div className="absolute left-0 top-full mt-2 z-50">
                <EmojiPickerPopover
                  onSelect={(emoji) => {
                    handleReact(comment._id, emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* INLINE REPLY BOX */}
          {activeReplyBox === comment._id && (
            <div className="mt-3 ml-0 sm:ml-14">
              <p className="text-xs text-gray-500 mb-1">
                Replying to{" "}
                <span className="font-semibold">{comment.author.username}</span>
              </p>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
                rows={1}
                className="w-full bg-transparent border-b border-gray-400 focus:border-primary focus:outline-none text-sm py-1 resize-none dark:text-text-light"
                placeholder="Write a reply..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply(comment._id, depth);
                  }
                }}
              />

              {/* REPLY MEDIA PREVIEW */}
              {(replyImagePreview || replyGif) && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={replyImagePreview || replyGif}
                    alt="Preview"
                    className="max-h-32 rounded-lg border border-border-light"
                  />
                  <button
                    onClick={clearReplyMedia}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 mt-2">
                <input
                  ref={replyFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReplyImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => replyFileInputRef.current?.click()}
                  className="text-gray-500 hover:text-primary transition"
                  title="Add image"
                >
                  <Image size={16} />
                </button>

                <button
                  onClick={() => setShowReplyGifPicker(true)}
                  className="text-xs font-semibold text-gray-500 hover:text-primary transition"
                >
                  GIF
                </button>

                <div className="flex-1" />

                <button
                  onClick={() => {
                    setReplyText("");
                    clearReplyMedia();
                    setActiveReplyBox(null);
                  }}
                  className="text-xs text-gray-500 hover:text-primary font-semibold transition"
                >
                  ✕
                </button>

                <button
                  onClick={() => handleSubmitReply(comment._id, depth)}
                  disabled={!replyText.trim() && !replyImage && !replyGif}
                  className="text-xs font-bold text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* VIEW REPLIES BUTTON */}
          {hasReplies && (
            <button
              onClick={() => setShowReplies((p) => !p)}
              className="text-xs font-semibold text-gray-500 hover:text-primary mt-2 transition w-fit"
            >
              {showReplies
                ? "Hide replies"
                : `View ${comment.replies.length} ${
                    comment.replies.length === 1 ? "reply" : "replies"
                  }`}
            </button>
          )}
        </div>
      </div>

      {/* NESTED REPLIES */}
      {showReplies &&
        hasReplies &&
        comment.replies.map((reply, idx) => {
          const isLast = idx === comment.replies.length - 1;

          return (
            <div
              key={reply._id}
              className="relative flex gap-3 p-2 pl-8 ml-8 sm:ml-14 border-l border-gray-300 dark:border-gray-600"
            >
              {isLast && (
                <div className="absolute -bottom-3 left-0 w-4 h-4 border-l border-b border-gray-300 dark:border-gray-600 rounded-bl-xl" />
              )}

              <CommentItem
                comment={reply}
                userId={userId}
                isMessageAuthor={isMessageAuthor}
                isModerator={isModerator}
                isAdmin={isAdmin}
                handleDelete={handleDelete}
                handleReact={handleReact}
                timeAgo={timeAgo}
                replyText={replyText}
                setReplyText={setReplyText}
                activeReplyBox={activeReplyBox}
                setActiveReplyBox={setActiveReplyBox}
                handleSubmitReply={handleSubmitReply}
                replyImage={replyImage}
                setReplyImage={setReplyImage}
                replyGif={replyGif}
                setReplyGif={setReplyGif}
                replyImagePreview={replyImagePreview}
                setReplyImagePreview={setReplyImagePreview}
                replyFileInputRef={replyFileInputRef}
                handleReplyImageSelect={handleReplyImageSelect}
                clearReplyMedia={clearReplyMedia}
                showReplyGifPicker={showReplyGifPicker}
                setShowReplyGifPicker={setShowReplyGifPicker}
                depth={depth + 1}
              />
            </div>
          );
        })}
    </div>
  );
};

export default CommComment;
