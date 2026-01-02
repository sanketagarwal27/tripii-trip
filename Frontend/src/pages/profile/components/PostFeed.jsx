// src/components/PostFeed.jsx
import React from "react";
import PostCard from "./PostCard";
import { Camera, AlignLeft } from "lucide-react";
import styles from "./PostFeed.module.css";

const PostFeed = ({ posts, user, onPostUpdate }) => {
  const enrichedPosts = posts.map((post) => ({ ...post, author: user }));
  // 1. Separate the data
  const visualPosts = enrichedPosts.filter(
    (p) => p.media && p.media.length > 0
  );
  const logPosts = enrichedPosts.filter(
    (p) => !p.media || p.media.length === 0
  );

  return (
    <div className={styles.container}>
      {/* --- VISUAL SECTION (GRID) --- */}
      {visualPosts.length > 0 && (
        <section>
          <div className={styles.sectionHeader}>
            <Camera className={styles.icon} size={20} />
            <h2>Visual Journal</h2>
          </div>

          {/* This div enforces the 2-Column Grid */}
          <div className={styles.visualGrid}>
            {visualPosts.map((post) => (
              <div key={post._id}>
                {/* Added onClick wrapper above */}
                <PostCard
                  key={post._id}
                  post={post}
                  onPostUpdate={onPostUpdate}
                  type="visual"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- TRAVEL LOG SECTION (VERTICAL) --- */}
      {logPosts.length > 0 && (
        <section>
          <div className={styles.sectionHeader}>
            <AlignLeft className={styles.icon} size={20} />
            <h2>Travel Log</h2>
          </div>

          {/* This div enforces the Vertical List */}
          <div className={styles.logStack}>
            {logPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostUpdate={onPostUpdate}
                type="log"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PostFeed;
