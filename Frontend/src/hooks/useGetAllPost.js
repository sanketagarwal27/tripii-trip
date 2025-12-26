// src/hooks/useGetAllPost.js
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "@/redux/postSlice";
import { getFeed } from "@/api/post";
import { getMe } from "@/api/users";
import { setUserProfile } from "@/redux/authslice";

const useGetAllPost = (shouldfetch) => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If your feed doesn't strictly require a logged-in user, fetch regardless.
    // If feed requires user, check for user !== null
    let cancelled = false;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await getFeed();
        if (cancelled) return;
        const postsData = res.data?.data?.posts || res.data?.posts || [];
        dispatch(setPosts(postsData));
        setError(null);

        const res2 = await getMe();
        dispatch(setUserProfile(res2.data?.data));
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.message || err.message || "Failed to load posts"
        );
        console.error("Failed to load posts:", err.response || err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // If feed needs a user, use: if (user === null) return;
    // But don’t flip loading state prematurely when user is undefined/null.
    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, [dispatch /* remove user unless necessary */]);

  return { loading, error };
};

export default useGetAllPost;
