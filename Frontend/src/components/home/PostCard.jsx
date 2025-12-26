import { useState } from "react";
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

const PostCard = ({ post }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userProfile } = useSelector((s) => s.auth);

  const [isLiked, setIsLiked] = useState(post.likes.includes(userProfile?._id));
  const [currentIndex, setCurrentIndex] = useState(0);

  const [inlineComment, setInlineComment] = useState("");

  /* ------------------------------------------
     LIKE HANDLER
  -------------------------------------------- */
  const handleLike = async () => {
    if (!userProfile) return toast.error("Login required");

    const prev = isLiked;
    setIsLiked(!isLiked); // optimistic

    try {
      const res = await toggleLike(post._id);
      dispatch(updatePost({ ...post, likes: res.data.data.likes }));

      if (res.data.data.updatedUser)
        dispatch(setUserProfile(res.data.data.updatedUser));
    } catch (err) {
      setIsLiked(prev);
    }
  };

  /* ------------------------------------------
     INLINE COMMENT SUBMIT
  -------------------------------------------- */
  const submitInlineComment = async () => {
    if (!inlineComment.trim()) return;

    try {
      const res = await addComment(post._id, inlineComment);
      const newComment = res.data.data;

      dispatch(
        updatePost({
          ...post,
          comments: [newComment, ...(post.comments || [])],
        })
      );

      setInlineComment("");
    } catch (err) {
      toast.error("Failed to comment");
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

  return (
    <div className="postcard">
      {/* HEADER */}
      <div className="postcard-header">
        <Link to = {`/profile/${post.author._id}`}>
        <img
          src={post.author?.profilePicture?.url || "/travel.jpg"}
          className="postcard-avatar"
        />
        </Link>
        <Link to = {`/profile/${post.author._id}`} className="postcard-header-info">
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

      {/* MEDIA CAROUSEL + THUMBNAILS (RESTORED!) */}
      {post.media?.length > 0 && (
        <div className="postcard-media-wrapper">
          <img src={post.media[currentIndex].url} className="postcard-media" />

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

          {/* ⭐ RESTORED THUMBNAILS */}
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
          <span>{post.likes?.length || 0}</span>
        </button>

        <button
          className="postcard-action-btn"
          onClick={() => {
            dispatch(setSelectedPost(post));
            navigate(`/post/${post._id}`);
          }}
        >
          <MessageSquare size={18} />
          <span>{post.comments?.length || 0}</span>
        </button>

        <button className="postcard-action-btn">
          <Bookmark size={18} />
        </button>

        <button className="postcard-action-btn postcard-share">
          <Share2 size={18} />
        </button>
      </div>

      {/* ⭐ INLINE COMMENT BOX (80% INPUT + 20% BUTTON) */}
      <div className="postcard-inline-comment">
        <input
          type="text"
          placeholder="Add a comment..."
          className="postcard-inline-input"
          value={inlineComment}
          onChange={(e) => setInlineComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitInlineComment()}
        />

        {/* Only show when typing */}
        {inlineComment.trim() && (
          <button className="postcard-inline-btn" onClick={submitInlineComment}>
            Post
          </button>
        )}
      </div>
    </div>
  );
};

export default PostCard;
