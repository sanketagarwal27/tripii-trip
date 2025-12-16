import api from "@/api/axios";

export const fetchNews = async (place) => {
  console.log("Getting news for:", place);

  const response = await api.get("/api/news", {
    params: {
      place: place,
    },
    withCredentials: true,
  });

  return response.data;
};
