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
  const { userProfile } = useSelector((s) => s.auth);

  const hasLiked = post.likes?.some(
    (l) => l.user === userProfile?._id || l.user?._id === userProfile?._id
  );

  const [isLiked, setIsLiked] = useState(hasLiked);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [inlineComment, setInlineComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [contextualLikes, setContextualLikes] = useState([]);
  const [likesPreviewLoading, setLikesPreviewLoading] = useState(false);
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);

  /* ------------------------------------------
     LIKE HANDLER
  -------------------------------------------- */

  useEffect(() => {
    setIsLiked(
      post.likes?.some(
        (l) => l.user === userProfile?._id || l.user?._id === userProfile?._id
      )
    );
    setLikeCount(post.likes?.length || 0);
  }, [post.likes, userProfile?._id]);

  const handleLike = async () => {
    if (!userProfile) return toast.error("Login required");

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
        })
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

  useEffect(() => {
    let cancelled = false;

    const fetchPreviewLikes = async () => {
      if (!userProfile || post.likes.length === 0) return;

      try {
        setLikesPreviewLoading(true);
        const res = await getContextualPostLikes(post._id, 5);
        if (!cancelled) {
          setContextualLikes(res.data?.data?.users || []);
        }
      } catch (err) {
        console.error("Failed to load contextual likes");
      } finally {
        if (!cancelled) setLikesPreviewLoading(false);
      }
    };

    fetchPreviewLikes();

    return () => {
      cancelled = true;
    };
  }, [post._id, post.likes?.length, userProfile?._id]);

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

        {post.author._id === userProfile?._id && (
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
            className="
    w-full
    object-cover
    rounded-xl
    select-none
  "
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

      {contextualLikes.length > 0 && (
        <div className="mt-1 flex items-center gap-2">
          {/* Avatars */}
          <div className="flex items-center">
            <p style={{ color: "grey", fontSize: "12px", marginRight: "15px" }}>
              Liked by :
            </p>
            {contextualLikes.slice(0, 5).map((u) => (
              <img
                key={u._id}
                src={u.profilePicture?.url || "/travel.jpg"}
                className="
            w-6 h-6
            rounded-full
            object-cover
            border-2 border-white
            -ml-2
            first:ml-0
          "
              />
            ))}
          </div>

          {/* Show more */}
          {(post.likes?.length || 0) > contextualLikes.length && (
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
          className="
    flex-1
    text-sm
    px-3 py-2
    rounded-full
    bg-zinc-100 dark:bg-zinc-800
    focus:outline-none
  "
          value={inlineComment}
          onChange={(e) => setInlineComment(e.target.value)}
          disabled={isPostingComment}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isPostingComment) {
              submitInlineComment();
            }
          }}
        />

        {/* Only show when typing */}
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
      {showLikesOverlay && (
        <PostLikesOverlay
          postId={post._id}
          onClose={() => setShowLikesOverlay(false)}
        />
      )}
    </div>
  );
};

export default PostCard;
