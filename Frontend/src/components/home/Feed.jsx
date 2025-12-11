import { useSelector } from "react-redux";
import PostCard from "./PostCard";
import CreatePostBox from "./CreatePostBox";
import React from "react";

const Feed = () => {
  const posts = useSelector((state) => state.post.posts);
  console.log("Himanshu");
  return (
    <div className="feed">
      <CreatePostBox />

      {!posts || posts.length === 0 ? (
        <div className="feed-empty">
          <p>No posts yet. Be the first to post!</p>
        </div>
      ) : (
        posts.map((post) => {
          if (!post || !post.author) {
            console.warn("⚠️ Invalid post skipped:", post);
            return null;
          }
          return <PostCard key={post._id} post={post} />;
        })
      )}
    </div>
  );
};

export default Feed;
