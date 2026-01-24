// useGetMyTrips.js - Updated without TripActivities
import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUserTripData } from "@/api/trip";
import {
  setTripLoading,
  setTripError,
  clearTripError,
  setTrips,
  appendTrips,
  setPaginationMeta,
  hydrateTripData,
} from "@/redux/tripSlice";
import { socket } from "../../Socket.js";

export default function useGetMyTrips() {
  const dispatch = useDispatch();
  const hasInitialized = useRef(false);

  const {
    pagination: { page, limit, hasMore, search },
    trips,
    loading,
  } = useSelector((s) => s.trip);

  /* ---------------- CORE FETCH ---------------- */
  const fetchTrips = useCallback(
    async ({ pageOverride, searchOverride, replace = false } = {}) => {
      try {
        dispatch(setTripLoading(true));
        dispatch(clearTripError());

        const finalPage = pageOverride ?? page;
        const finalSearch =
          searchOverride !== undefined ? searchOverride : search;

        const res = await getAllUserTripData({
          page: finalPage,
          limit,
          search: finalSearch,
        });

        const {
          trips: fetchedTrips,
          expenses,
          tripPlans,
          tripChecklists,
          tripClosures,
          tripPlaces,
          tripRoles,
          tripWallets,
        } = res.data.data;

        const { hasMore: more, totalTrips } = res.data;

        // Update trips
        if (replace || finalPage === 1) {
          dispatch(setTrips(fetchedTrips));
        } else {
          dispatch(appendTrips(fetchedTrips));
        }

        // Update pagination
        dispatch(
          setPaginationMeta({
            page: finalPage,
            hasMore: more,
            totalTrips,
          }),
        );

        // Hydrate related data (removed tripActivities)
        dispatch(
          hydrateTripData({
            expenses,
            tripPlans,
            tripChecklists,
            tripClosures,
            tripPlaces,
            tripRoles,
            tripWallets,
          }),
        );
      } catch (err) {
        dispatch(
          setTripError(err?.response?.data?.message || "Failed to load trips."),
        );
      } finally {
        dispatch(setTripLoading(false));
      }
    },
    [dispatch, page, limit, search],
  );

  /* ---------------- INITIAL LOAD (ONCE) ---------------- */
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchTrips({ pageOverride: 1, replace: true });
    }
  }, []);

  /* ---------------- SOCKET JOIN ---------------- */
  useEffect(() => {
    if (!socket || !socket.connected) return;
    if (!Array.isArray(trips.list) || trips.list.length === 0) return;

    trips.list.forEach((tripId) => {
      socket.emit("joinTrip", tripId);
    });
  }, [trips.list]);

  return {
    loading,
    hasMore,

    // Load next page (keeps previous pages)
    loadMore: () => {
      if (!loading && hasMore) {
        fetchTrips({ pageOverride: page + 1 });
      }
    },

    // Reload with new search (replaces all)
    reload: ({ searchOverride } = {}) => {
      fetchTrips({
        pageOverride: 1,
        searchOverride,
        replace: true,
      });
    },
  };
}
