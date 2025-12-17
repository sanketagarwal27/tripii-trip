import api from "@/api/axios";

export const fetchNews = async (place) => {
  console.log("Getting news for:", place);

  const response = await api.get("/api/places/news", {
    params: {
      place: place,
    },
    withCredentials: true,
  });
  return response.data;
};

export const fetchHeroImage = async (place) => {
  console.log(`Getting Hero Image for ${place}`);

  const response = await api.get("/api/places/get-hero-image", {
    params: {
      place,
    },
    withCredentials: true,
  });
  return response.data; //Axios wraps the response in another level of data so destructuring data once here only
};
