import api from "@/api/axios";

export const fetchNews = async (place) => {
  const response = await api.get("/api/places/news", {
    params: {
      place: place,
    },
    withCredentials: true,
  });
  return response.data;
};

export const fetchHeroImage = async (place) => {
  const response = await api.get("/api/places/get-hero-image", {
    params: {
      place,
    },
    withCredentials: true,
  });
  return response.data; //Axios wraps the response in another level of data so destructuring data once here only
};

export const fetchPhotos = async (place) => {
  const response = await api.get("/api/places/get-photos", {
    params: {
      place,
    },
    withCredentials: true,
  });
  return response.data;
};

export const fecthOverview = async (place) => {
  const response = await api.get("/api/places/get-overview", {
    params: {
      place,
    },
    withCredentials: true,
  });
  return response.data;
};
