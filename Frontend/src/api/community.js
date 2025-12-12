import api from "@/api/axios";

export const searchCommunities = (params = {}) =>
  api.get("/api/community/searchCommunities", {
    params,
    withCredentials: true,
  });

export const searchMyCommunities = (params = {}) =>
  api.get("/api/community/searchMyCommunities", {
    params,
    withCredentials: true,
  });

export const getMyCommunities = () =>
  api.get("/api/community/getMyCommunities", { withCredentials: true });

export const suggestedCommunities = () =>
  api.get("/api/community/SuggestedCommunities", { withCredentials: true });

export const joinPublicCommunity = (communityId, displayName) =>
  api.post(
    `/api/community/joinCommunity/${communityId}`,
    { displayName },
    { withCredentials: true }
  );

export const addMembers = (communityId, members = []) =>
  api.post(
    `/api/community/addMember/${communityId}`,
    { members },
    { withCredentials: true }
  );

export const leaveCommunity = (communityId) =>
  api.post(
    `/api/community/leaveCommunity/${communityId}`,
    {},
    { withCredentials: true }
  );

export const getCommunityMembers = (communityId, params = {}) =>
  api.get(`/api/community/getCommunityMembers/${communityId}`, {
    params,
    withCredentials: true,
  });

export const getCommunityProfile = (communityId) =>
  api.get(`/api/community/getCommunityProfile/${communityId}`, {
    withCredentials: true,
  });

export const createCommunity = (formData) =>
  api.post("/api/community/createCommunity", formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });