import { setSelectedPost, updatePost } from "@/redux/postSlice"; // Import both actions
import styles from "./PostCard.module.css";
import { formatDistanceToNow } from "date-fns";
import { Heart, Quote, Plane, Layers, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleLike } from "@/api/post";
import toast from "react-hot-toast";
import PostModal from "./PostModal";

const PostCard = ({ post, type = "visual", onPostUpdate }) => {
  const [forModal, setForModal] = useState(null);
  const isVisual = type === "visual";
  const imageCount = post.media?.length || 0;
  const hasMultiple = imageCount > 1;

  // --- REDUX HOOKS ---
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userProfile } = useSelector((store) => store.auth);

  // We need 'selectedPost' to check if we are currently viewing this post in details
  const { selectedPost } = useSelector((store) => store.post);

  // --- LOCAL STATE (Optimistic UI) ---
  const [likes, setLikes] = useState(post?.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(
    post?.likes?.includes(userProfile?._id)
  );

  // --- HANDLE LIKE ---
  const handleLike = async (e) => {
    e?.stopPropagation(); // Prevent modal opening
    if (!userProfile) return toast.error("Login required");

    // 1. Optimistic Update (Immediate visual change)
    const previousLikes = likes;
    const previousIsLiked = isLiked;

    setIsLiked(!previousIsLiked);
    setLikes(previousIsLiked ? previousLikes - 1 : previousLikes + 1);

    try {
      // 2. API Call
      const res = await toggleLike(post._id);

      if (res.data?.success) {
        // Create the updated post object with new likes array from server
        const updatedPostData = { ...post, likes: res.data.data.likes };

        // 3. Update the Global Feed List
        dispatch(updatePost(updatedPostData));
        if (onPostUpdate) {
          onPostUpdate(updatedPostData);
        }

        // 4. Update Selected Post (Syncs Details Page)
        // Since your slice doesn't do this automatically, we check manually:
        // "If the post I just liked is the same as the one currently selected in Redux..."
        if (selectedPost?._id === post._id) {
          dispatch(setSelectedPost(updatedPostData));
        }
      }
    } catch (err) {
      // 5. Revert on Error
      setIsLiked(previousIsLiked);
      setLikes(previousLikes);
      console.error("Like failed:", err);
      toast.error("Could not like post");
    }
  };

  // --- RENDER VISUAL CARD (Standard) ---
  if (isVisual) {
    return (
      <>
        <div className={styles.visualCard}>
          <div className={styles.imageWrapper}>
            <img
              src={post.media[0]?.url}
              alt={post.caption}
              className={styles.postImage}
              onClick={() => setForModal(post)}
            />
            {hasMultiple && (
              <div className={styles.multiBadge}>
                <Layers size={14} />
                <span>1/{imageCount}</span>
              </div>
            )}
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.title}>
              {post.caption.length <= 50
                ? post.caption
                : `${post.caption.substring(0, 100)}...`}
            </h3>
            <div className={styles.postcardActions}>
              <button className={styles.postCardActionBtn} onClick={handleLike}>
                <Heart
                  size={18}
                  className={isLiked ? styles.postcardLiked : ""}
                  fill={isLiked ? "red" : "none"}
                  color={isLiked ? "red" : "currentColor"}
                />
                <span>{likes}</span>
              </button>

              <button
                className={styles.postCardActionBtn}
                onClick={() => {
                  dispatch(setSelectedPost(post));
                  navigate(`/post/${post._id}`);
                }}
              >
                <MessageSquare size={18} />
                <span>{post.comments?.length || 0}</span>
              </button>
            </div>
            <div className={styles.footer}>
              <span className={styles.date}>
                {formatDistanceToNow(new Date(post.createdAt))} ago
              </span>
            </div>
          </div>
        </div>

        {/* Modal Logic */}
        {forModal && (
          <PostModal post={forModal} onClose={() => setForModal(null)} />
        )}
      </>
    );
  }

  // --- RENDER LOG CARD (Horizontal Row) ---
  return (
    <div className={styles.logCard}>
      <div className={styles.logIconBox}>
        {post.caption.length < 50 ? <Quote size={20} /> : <Plane size={20} />}
      </div>

      <div className={styles.logContent}>
        <p className={styles.logText}>
          <strong>{post.caption}</strong> {post.description}
        </p>
        <div className={styles.logFooter}>
          <div className={styles.postcardActions}>
            <button className={styles.postCardActionBtn} onClick={handleLike}>
              <Heart
                size={18}
                className={isLiked ? styles.postcardLiked : ""}
                fill={isLiked ? "red" : "none"}
                color={isLiked ? "red" : "currentColor"}
              />
              <span>{likes}</span>
            </button>

            <button
              className={styles.postCardActionBtn}
              onClick={() => {
                dispatch(setSelectedPost(post));
                navigate(`/post/${post._id}`);
              }}
            >
              <MessageSquare size={18} />
              <span>{post.comments?.length || 0}</span>
            </button>
          </div>
          <span className={styles.date}>
            {formatDistanceToNow(new Date(post.createdAt))} ago
          </span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
