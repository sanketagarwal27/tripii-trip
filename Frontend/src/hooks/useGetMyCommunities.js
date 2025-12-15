import { useEffect, useState } from "react";
import { getMyCommunities } from "@/api/community";
import { setMyCommunities } from "@/redux/communitySlice";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../../Socket.js";

export default function useGetMyCommunities() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const myCommunities = useSelector((s) => s.community.my);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await getMyCommunities();
      dispatch(setMyCommunities(res?.data?.data || []));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load communities.");
    } finally {
      setLoading(false);
    }
  };

  // 1️⃣ Initial fetch
  useEffect(() => {
    fetchCommunities();
  }, []);

  // 2️⃣ Join socket rooms whenever communities change
  useEffect(() => {
    if (!socket || !socket.connected) return;
    if (!Array.isArray(myCommunities) || myCommunities.length === 0) return;

    myCommunities.forEach((community) => {
      socket.emit("joinCommunity", community._id);
    });
  }, [myCommunities]);

  return { loading, error, reload: fetchCommunities };
}
