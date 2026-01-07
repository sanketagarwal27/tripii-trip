import axios from "axios";

export const getOSMPlaceData = async (place) => {
  const res = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q: place,
      format: "json",
      addressdetails: 1,
      limit: 1,
    },
    headers: {
      "User-Agent": "TripiiTrip/1.0 (contact@tripiitrip.com)",
    },
  });

  if (!res.data || !res.data.length) return null;

  const p = res.data[0];

  return {
    displayName: p.display_name,
    lat: parseFloat(p.lat),
    lon: parseFloat(p.lon),
    type: p.type,
    category: p.class,
    importance: p.importance, // 0–1 (VERY useful!)
  };
};
