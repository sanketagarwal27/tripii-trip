import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setPosts } from "@/redux/postSlice";
import { getFeed } from "@/api/post";

const useGetAllPost = ({ page = 1, limit = 20 } = {}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getFeed({ page, limit });
        if (cancelled) return;

        const posts = res.data?.data?.posts ?? [];
        dispatch(setPosts(posts));
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.message || err.message || "Failed to load feed"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, [dispatch, page, limit]);

  return { loading, error };
};

export default useGetAllPost;
