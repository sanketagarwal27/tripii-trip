import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  getCommunityProfile,
  getCommunityRooms,
  getCommunityActivities,
} from "@/api/community";
import {
  setCommunityProfile,
  setCommunityRooms,
  setCommunityActivities,
  setCommunityError,
} from "@/redux/communitySlice";

export default function useCommunityProfile(communityId) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!communityId) return;

    let cancelled = false;

    const loadCommunity = async () => {
      try {
        setLoading(true);

        // 🔥 Start background fetch EARLY
        const roomsPromise = getCommunityRooms(communityId);
        const activitiesPromise = getCommunityActivities(communityId);

        // 🔥 Critical: profile first
        const pRes = await getCommunityProfile(communityId);
        if (cancelled) return;

        dispatch(
          setCommunityProfile({
            ...pRes.data.data,
            isMember: !!pRes.data.data?.currentUserRole,
          })
        );

        // 🔓 Unlock UI
        setLoading(false);

        // Background resolve
        roomsPromise.then((rRes) => {
          if (!cancelled) {
            dispatch(
              setCommunityRooms({
                communityId,
                rooms: rRes?.data?.data?.rooms || [],
              })
            );
          }
        });

        activitiesPromise.then((aRes) => {
          if (!cancelled) {
            dispatch(
              setCommunityActivities({
                communityId,
                activities: aRes?.data?.data?.activities || [],
              })
            );
          }
        });
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCommunity();
    return () => {
      cancelled = true;
    };
  }, [communityId, dispatch]);

  return { loading };
}
