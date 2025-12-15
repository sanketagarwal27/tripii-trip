import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ThumbsUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getCommentsByPost,
  addComment,
  toggleCommentLike,
  deleteComment,
  getPostById,
} from "@/api/post";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

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
 * CAROUSEL COMPONENT
 * ------------------------------------------------- */
const PostCarousel = ({ images }) => {
  const [index, setIndex] = useState(0);

  const goPrev = () => setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const goNext = () => setIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  let startX = 0;
  const onTouchStart = (e) => (startX = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (diff > 50) goPrev();
    if (diff < -50) goNext();
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <img src={images[index].url} className="w-full rounded-xl object-cover" />

      {/* COUNTER */}
      <div className="absolute top-2 right-2 bg-black/60 px-3 py-1 rounded-full text-white text-sm">
        {index + 1}/{images.length}
      </div>

      {/* ARROWS */}
      {images.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full"
          >
            <ChevronLeft color="white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full"
          >
            <ChevronLeft color="white" style={{ rotate: "180deg" }} />
          </button>
        </>
      )}
    </div>
  );
};

/* -------------------------------------------------
 * MAIN COMMENT PAGE
 * ------------------------------------------------- */
const CommentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const userProfile = useSelector((s) => s.auth.userProfile);
  // const feedPost = useSelector((s) => s.post.posts.find((p) => p._id === id));
  const feedPost = useSelector((s) => s.post.selectedPost); //Yaad rkhna uper wale like ko hata ke ye line lagae hai (post ke comment load krne me koi dikkat ho to yaha se kr lena tk , uper wale me sb tk hai)

  const [post, setPost] = useState(feedPost || null);
  const [loadingPost, setLoadingPost] = useState(!post);

  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  const [replyText, setReplyText] = useState("");
  const [activeReplyBox, setActiveReplyBox] = useState(null);

  /* FETCH POST IF NOT IN REDUX */
  useEffect(() => {
    if (post) return;
    const loadPost = async () => {
      try {
        const res = await getPostById(id);
        setPost(res.data.data);
      } catch {
        toast.error("Failed to load post");
      } finally {
        setLoadingPost(false);
      }
    };
    loadPost();
  }, [id, post]);

  /* FETCH COMMENTS */
  /* LOAD COMMENTS */
  const loadComments = async () => {
    try {
      const res = await getCommentsByPost(id);
      let fetched = res.data.data.comments;

      // 1️⃣ Remove deleted TOP-LEVEL comments
      fetched = fetched.filter((c) => !c.isDeleted);

      // 2️⃣ Remove deleted REPLIES
      fetched = fetched.map((c) => ({
        ...c,
        replies: Array.isArray(c.replies)
          ? c.replies.filter((r) => !r.isDeleted)
          : [],
      }));

      setComments(
        fetched.map((c) => ({
          ...c,
          _remove: false,
        }))
      );
    } catch {
      toast.error("Failed to load comments");
    }
  };

  console.log("comment:", comments);

  useEffect(() => {
    loadComments();
  }, [id]);

  /* ADD COMMENT */
  const handleSubmitMain = async () => {
    if (!text.trim()) return;

    try {
      const res = await addComment(id, text, null);
      setComments((prev) => [
        { ...res.data.data, replies: [], _remove: false },
        ...prev,
      ]);
      setText("");
    } catch {
      toast.error("Failed to comment");
    }
  };

  /* ADD REPLY */
  const handleSubmitReply = async (parentId) => {
    if (!replyText.trim()) return;

    try {
      const res = await addComment(id, replyText, parentId);
      const newReply = { ...res.data.data, replies: [], _remove: false };

      setComments((prev) =>
        prev.map((c) =>
          c._id === parentId ? { ...c, replies: [newReply, ...c.replies] } : c
        )
      );

      setReplyText("");
      setActiveReplyBox(null);
    } catch {
      toast.error("Failed to reply");
    }
  };

  /* DELETE COMMENT */
  const handleDelete = async (commentId, isReply, parentId) => {
    try {
      await deleteComment(commentId);

      // fade-out then remove
      if (!isReply) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, _remove: true } : c))
        );
        setTimeout(
          () => setComments((prev) => prev.filter((c) => c._id !== commentId)),
          300
        );
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId
              ? {
                  ...c,
                  replies: c.replies.filter((r) => r._id !== commentId),
                }
              : c
          )
        );
      }
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  /* LIKE COMMENT */
  const handleLike = async (commentId) => {
    try {
      const res = await toggleCommentLike(commentId);
      const { likes, likeCount } = res.data.data;

      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, likes, likeCount }
            : {
                ...c,
                replies: c.replies.map((r) =>
                  r._id === commentId ? { ...r, likes, likeCount } : r
                ),
              }
        )
      );
    } catch {}
  };

  if (loadingPost) return <p>Loading...</p>;

  return (
    <div className="commentpage">
      <div className="mx-auto" style={{ width: "70%", marginTop: "80px" }}>
        <button
          onClick={() => navigate(-1)}
          className="flex mb-3 items-center gap-2 text-gray-700 hover:text-primary transition"
        >
          <ChevronLeft size={20} /> Back to Feed
        </button>

        {/* POST */}
        <div className="rounded-xl shadow-sm mb-4">
          <div className="flex gap-4 items-center mb-3 pl-1">
            <img
              src={post?.author?.profilePicture?.url || "/travel.jpg"}
              className="size-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{post?.author?.username}</p>
              <p className="text-xs text-gray-500">
                {new Date(post?.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {post.media?.length > 1 ? (
            <PostCarousel images={post.media} />
          ) : post.media?.length === 1 ? (
            <img
              src={post.media[0].url}
              className="w-full rounded-xl object-cover"
            />
          ) : (
            <div className="p-6 text-lg">{post.caption}</div>
          )}
        </div>

        {/* MAIN INPUT */}
        <div className="flex items-start p-4 gap-4 bg-white rounded-xl shadow-sm mb-4">
          <img
            src={userProfile?.profilePicture?.url || "/travel.jpg"}
            className="size-10 rounded-full object-cover"
          />

          <textarea
            placeholder="Share your thoughts..."
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 rounded-lg border bg-background-light resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitMain(); // 🚀 submit on Enter
              }
            }}
          />

          <button
            onClick={handleSubmitMain}
            className="min-w-[84px] px-4 bg-primary text-black rounded-lg h-9"
          >
            Post
          </button>
        </div>

        {/* COMMENTS LIST */}
        <div className="p-4 bg-white rounded-xl shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-gray-800">Comments</h3>

          {comments.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Be the first to comment ✨
            </p>
          )}

          {comments.map((c) => (
            <CommentItem
              key={c._id}
              comment={c}
              onLike={handleLike}
              userId={userProfile?._id}
              postAuthorId={post?.author?._id}
              handleDelete={handleDelete}
              timeAgo={timeAgo}
              replyText={replyText}
              setReplyText={setReplyText}
              activeReplyBox={activeReplyBox}
              setActiveReplyBox={setActiveReplyBox}
              handleSubmitReply={handleSubmitReply} // ✅ ADD THIS
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------
 * COMMENT ITEM COMPONENT
 * ------------------------------------------------- */
const CommentItem = ({
  comment,
  onLike,
  userId,
  postAuthorId,
  handleDelete,
  timeAgo,
  replyText,
  setReplyText,
  activeReplyBox,
  setActiveReplyBox,
  handleSubmitReply,
}) => {
  const replies = (comment.replies || []).filter((r) => !r.isDeleted);

  const [showReplies, setShowReplies] = useState(false);

  const canDelete = userId === comment.author._id || userId === postAuthorId;

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
                className="text-gray-500 cursor-pointer hover:text-gray-600"
                onClick={() => handleDelete(comment._id, false, null)}
              />
            )}
          </div>

          <p className="text-sm mt-1">{comment.text}</p>

          {/* ACTIONS */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() =>
                setActiveReplyBox(
                  activeReplyBox === comment._id ? null : comment._id
                )
              }
              className="text-xs font-semibold text-gray-500 hover:text-primary"
            >
              REPLY
            </button>

            <button
              onClick={() => onLike(comment._id)}
              className="flex items-center gap-1 text-gray-500 hover:text-primary"
            >
              <ThumbsUp size={16} />
              <span>{comment.likeCount || 0}</span>
            </button>
          </div>

          {/* INLINE REPLY BOX */}
          {activeReplyBox === comment._id && (
            <div className="mt-2 ml-14">
              <p className="text-xs text-gray-500 mb-1">
                Replying to{" "}
                <span className="font-semibold">{comment.author.username}</span>
              </p>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
                rows={1}
                className="w-full bg-transparent border-b border-gray-400 focus:border-primary focus:outline-none text-sm py-1 resize-none"
                placeholder="Write a reply..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply(comment._id); // 🚀 submit reply on Enter
                  }
                }}
              />

              <div className="flex justify-end gap-3 mt-1">
                <button
                  onClick={() => {
                    setReplyText("");
                    setActiveReplyBox(null);
                  }}
                  className="text-xs text-gray-500 hover:text-primary font-semibold"
                >
                  ✕
                </button>

                <button
                  onClick={() => handleSubmitReply(comment._id)}
                  disabled={!replyText.trim()}
                  className="text-xs font-bold text-primary disabled:opacity-40 black pointer"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* VIEW REPLIES BUTTON */}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies((p) => !p)}
              className="text-xs font-semibold text-gray-500 hover:text-primary mt-2 ml-1"
            >
              {showReplies ? "Hide replies" : `View ${replies.length} replies`}
            </button>
          )}
        </div>
      </div>

      {/* REPLIES */}
      {showReplies &&
        replies.map((r, idx) => {
          const isLast = idx === replies.length - 1;

          return (
            <div
              key={r._id}
              className="
          relative
          flex gap-4 p-2 pl-8 ml-14 
          border-l border-gray-500/60
        "
            >
              {/* CURVED LINE FOR THE LAST REPLY */}
              {isLast && (
                <div
                  className="
              absolute 
              -bottom-3 
              left-0 
              w-4 
              h-4 
              border-l 
              border-b 
              border-gray-500/60
              rounded-bl-xl
            "
                />
              )}

              <img
                src={r.author.profilePicture?.url || "/travel.jpg"}
                className="size-10 rounded-full object-cover mt-1"
              />

              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <div className="flex items-baseline gap-2">
                    <p className="font-semibold text-sm">{r.author.username}</p>
                    <p className="text-xs text-gray-500">
                      {timeAgo(r.createdAt)}
                    </p>
                  </div>

                  {(userId === r.author._id || userId === postAuthorId) && (
                    <Trash2
                      size={16}
                      className="text-gray-500 cursor-pointer hover:text-gray-600"
                      onClick={() => handleDelete(r._id, true, comment._id)}
                    />
                  )}
                </div>

                <p className="text-sm mt-1">{r.text}</p>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={() => onLike(r._id)}
                    className="flex items-center gap-1 text-gray-500 hover:text-primary"
                  >
                    <ThumbsUp size={16} />
                    <span>{r.likeCount || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default CommentPage;
