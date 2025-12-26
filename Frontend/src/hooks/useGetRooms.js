import { getMyRooms, getActiveTripRooms, getSuggestedRooms } from "@/api/room";

import {
  setRoomLoading,
  setMyRooms,
  setTripRooms,
  setSuggestedRooms,
  setRoomError,
} from "@/redux/roomSlice";
import { useEffect } from "react";

import { useDispatch } from "react-redux";

const useGetRooms = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetch = async () => {
      dispatch(setRoomLoading(true));

      try {
        const [my, trip, suggested] = await Promise.all([
          getMyRooms(),
          getActiveTripRooms(),
          getSuggestedRooms(),
        ]);

        console.log("My", my);
        console.log("trip", trip);
        console.log("Suggested", suggested);

        dispatch(setMyRooms(my.data.data.rooms));
        dispatch(setTripRooms(trip.data.data.rooms));
        dispatch(setSuggestedRooms(suggested.data.data.rooms));
      } catch (e) {
        dispatch(setRoomError("Failed to fetch rooms"));
      } finally {
        dispatch(setRoomLoading(false));
      }
    };

    fetch();
  }, []);
};

export default useGetRooms;
