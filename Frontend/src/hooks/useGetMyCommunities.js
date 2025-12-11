import { useEffect, useState } from "react";
import { getMyCommunities } from "@/api/community";
import { setMyCommunities } from "@/redux/communitySlice";
import { useDispatch } from "react-redux";

export default function useGetMyCommunities() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await getMyCommunities();
      dispatch(setMyCommunities(res?.data?.data));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load communities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  return { loading, error, refetch: fetchCommunities };
}
