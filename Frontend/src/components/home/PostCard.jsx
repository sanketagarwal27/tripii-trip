import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleLike,
  deletePost as apiDeletePost,
  addComment,
} from "@/api/post";

import { updatePost, removePost, setSelectedPost } from "@/redux/postSlice";
import { setUserProfile } from "@/redux/authslice";

import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getContextualPostLikes } from "@/api/post";
import PostLikesOverlay from "./PostLikesOverlay";

const PostCard = ({ post }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const hasLiked = post.likes?.some(
    (l) => l.user === user?._id || l.user?._id === user?._id,
  );

  const [isLiked, setIsLiked] = useState(hasLiked);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [inlineComment, setInlineComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  // 🔥 Single source of truth for likes data
  const [allLikesUsers, setAllLikesUsers] = useState([]);
  const [likesPage, setLikesPage] = useState(1);
  const [hasMoreLikes, setHasMoreLikes] = useState(true);
  const [likesLoading, setLikesLoading] = useState(false);
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);

  /* ------------------------------------------
     LIKE HANDLER
  -------------------------------------------- */

  useEffect(() => {
    setIsLiked(
      post.likes?.some(
        (l) => l.user === user?._id || l.user?._id === user?._id,
      ),
    );
    setLikeCount(post.likes?.length || 0);
  }, [post.likes, user?._id]);

  const handleLike = async () => {
    if (!user) return toast.error("Login required");

    const prevLiked = isLiked;
    const prevCount = likeCount;

    // 🔥 optimistic UI
    setIsLiked(!prevLiked);
    setLikeCount((c) => (prevLiked ? c - 1 : c + 1));

    try {
      const res = await toggleLike(post._id);

      // sync with backend truth
      dispatch(updatePost({ ...post, likes: res.data.data.likes }));

      if (res.data.data.updatedUser) {
        dispatch(setUserProfile(res.data.data.updatedUser));
      }
    } catch (err) {
      // rollback on failure
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error("Failed to update like");
    }
  };

  /* ------------------------------------------
     FETCH LIKES DATA (called once, shared)
  -------------------------------------------- */
  const fetchLikes = async (pageNum) => {
    if (!user || post.likes.length === 0) return;

    setLikesLoading(true);
    try {
      const res = await getContextualPostLikes(post._id, 20, pageNum);
      const incoming = res.data?.data?.users || [];

      // Deduplicate by _id
      setAllLikesUsers((prev) => {
        const map = new Map(prev.map((u) => [u._id, u]));
        incoming.forEach((u) => map.set(u._id, u));
        return Array.from(map.values());
      });

      if (incoming.length < 20) {
        setHasMoreLikes(false);
      }
    } catch (err) {
      console.error("Failed to load likes");
    } finally {
      setLikesLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchLikes(1);
  }, [post._id, post.likes?.length, user?._id]);

  const loadMoreLikes = () => {
    const nextPage = likesPage + 1;
    setLikesPage(nextPage);
    fetchLikes(nextPage);
  };

  /* ------------------------------------------
     INLINE COMMENT SUBMIT
  -------------------------------------------- */
  const submitInlineComment = async () => {
    if (!inlineComment.trim() || isPostingComment) return;

    setIsPostingComment(true);

    try {
      const res = await addComment(post._id, inlineComment);
      const newComment = res.data.data;

      dispatch(
        updatePost({
          ...post,
          commentCount: (post.commentCount || 0) + 1,
        }),
      );

      setInlineComment("");
    } catch (err) {
      toast.error("Failed to comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  /* ------------------------------------------
     DELETE POST
  -------------------------------------------- */
  const handleDelete = async () => {
    try {
      const res = await apiDeletePost(post._id);

      if (res.data.success) {
        dispatch(removePost(post._id));

        if (res.data.data.updatedUser)
          dispatch(setUserProfile(res.data.data.updatedUser));
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Show only first 5 for preview
  const previewLikes = allLikesUsers.slice(0, 5);

  return (
    <div className="postcard">
      {/* HEADER */}
      <div className="postcard-header">
        <Link to={`/profile/${post.author._id}`}>
          <img
            src={post.author?.profilePicture?.url || "/travel.jpg"}
            className="postcard-avatar"
          />
        </Link>
        <Link
          to={`/profile/${post.author._id}`}
          className="postcard-header-info"
        >
          <p className="postcard-username">{post.author.username}</p>
          <p className="postcard-time">
            {new Date(post.createdAt).toLocaleString()}
          </p>
        </Link>

        {post.author._id === user?._id && (
          <button className="postcard-delete-btn" onClick={handleDelete}>
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* CAPTION */}
      {post.caption && (
        <p className="postcard-caption" style={{ fontSize: "16px" }}>
          {post.caption}
        </p>
      )}

      {/* MEDIA CAROUSEL + THUMBNAILS */}
      {post.media?.length > 0 && (
        <div className="postcard-media-wrapper">
          <img
            src={post.media[currentIndex].url}
            className="w-full object-cover rounded-xl select-none"
          />

          {currentIndex > 0 && (
            <button
              className="carousel-arrow left"
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {currentIndex < post.media.length - 1 && (
            <button
              className="carousel-arrow right"
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* THUMBNAILS */}
          {post.media.length > 1 && (
            <div className="carousel-thumbnails">
              {post.media.map((m, i) => (
                <img
                  key={i}
                  src={m.url}
                  className={`thumb ${i === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIONS */}
      <div className="postcard-actions">
        <button className="postcard-action-btn" onClick={handleLike}>
          <Heart size={18} className={isLiked ? "postcard-liked" : ""} />
          <span>{likeCount}</span>
        </button>

        <button
          className="postcard-action-btn"
          onClick={() => {
            dispatch(setSelectedPost(post));
            navigate(`/post/${post._id}`);
          }}
        >
          <MessageSquare size={18} />
          <span>{post.commentCount || 0}</span>
        </button>

        <button className="postcard-action-btn">
          <Bookmark size={18} />
        </button>

        <button className="postcard-action-btn postcard-share">
          <Share2 size={18} />
        </button>
      </div>

      {/* LIKES PREVIEW (first 5) */}
      {previewLikes.length > 0 && (
        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center">
            <p style={{ color: "grey", fontSize: "12px", marginRight: "15px" }}>
              Liked by :
            </p>
            {previewLikes.map((u) => (
              <img
                key={u._id}
                src={u?.profilePicture?.url || "/travel.jpg"}
                className="w-6 h-6 rounded-full object-cover border-2 border-white -ml-2 first:ml-0"
              />
            ))}
          </div>

          {/* Show more button if total likes > 5 */}
          {likeCount > 5 && (
            <button
              onClick={() => setShowLikesOverlay(true)}
              className="text-xs text-zinc-500 hover:text-primary"
            >
              Show more
            </button>
          )}
        </div>
      )}

      {/* INLINE COMMENT BOX */}
      <div className="mt-1 flex items-center gap-2">
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 text-sm px-3 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 focus:outline-none"
          value={inlineComment}
          onChange={(e) => setInlineComment(e.target.value)}
          disabled={isPostingComment}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isPostingComment) {
              submitInlineComment();
            }
          }}
        />

        {inlineComment.trim() && (
          <button
            className="postcard-inline-btn"
            onClick={submitInlineComment}
            disabled={isPostingComment}
          >
            {isPostingComment ? "Posting..." : "Post"}
          </button>
        )}
      </div>

      {/* OVERLAY - pass all data down */}
      {showLikesOverlay && (
        <PostLikesOverlay
          users={allLikesUsers}
          hasMore={hasMoreLikes}
          loading={likesLoading}
          onLoadMore={loadMoreLikes}
          onClose={() => setShowLikesOverlay(false)}
        />
      )}
    </div>
  );
};

export default PostCard;
