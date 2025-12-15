import { useEffect, useState } from "react";
import { suggestedCommunities } from "@/api/community";
import { useDispatch } from "react-redux";
import { setSuggestedCommunities } from "@/redux/communitySlice";

export default function useGetSuggestedCommunities() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await suggestedCommunities();
      dispatch(setSuggestedCommunities(res?.data?.data));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return { loading, error, reload: fetchSuggestions };
}
