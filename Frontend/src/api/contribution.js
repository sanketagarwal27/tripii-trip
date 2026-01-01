import api from "@/api/axios";

export const newContribution = async (timeline, tripMeta) => {
  const payload = {
    timeline: timeline,
    tripMeta: tripMeta,
  };
  const res = await api.post("/api/contribution/add", payload, {
    withCredentials: true,
  });
  return res.data;
};

export const uploadImages = async (payload) => {
  const response = await api.post("/api/contribution/upload-photos", payload, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// export const fetchDrafts = () => {
//   api.get("/api/contribution/get-drafts", { withCredentials: true });
// };

// export const fetchSubmittedContributions = () => {
//   api.get("/api/contribution/get-submitted", { withCredentials: true });
// };
