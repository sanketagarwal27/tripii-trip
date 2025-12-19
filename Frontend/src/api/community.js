// src/api/community.js
import api from "@/api/axios";

/* --------------------------------------------------
   SEARCH / LISTS
-------------------------------------------------- */
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
  api.get("/api/community/getMyCommunities", {
    withCredentials: true,
  });

export const suggestedCommunities = () =>
  api.get("/api/community/SuggestedCommunities", {
    withCredentials: true,
  });

/* --------------------------------------------------
   MEMBERSHIP
-------------------------------------------------- */
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

/* --------------------------------------------------
   COMMUNITY PROFILE / CRUD
-------------------------------------------------- */
export const getCommunityProfile = (communityId) =>
  api.get(`/api/community/getCommunityProfile/${communityId}`, {
    withCredentials: true,
  });

export const createCommunity = (formData) =>
  api.post("/api/community/createCommunity", formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateCommunitySettings = (communityId, formData) =>
  api.post(`/api/community/communitySetting/${communityId}`, formData, {
    withCredentials: true,
  });

export const deleteCommunity = (communityId) =>
  api.delete(`/api/community/deletecommunity/${communityId}`, {
    withCredentials: true,
  });

/* --------------------------------------------------
   ROOMS / ACTIVITIES
-------------------------------------------------- */
export const getCommunityRooms = (communityId) =>
  api.get(`/api/community/getCommunityRooms/${communityId}`, {
    withCredentials: true,
  });

export const getCommunityActivities = (communityId, params = {}) =>
  api.get(`/api/community/CommunityActivity/${communityId}`, {
    params,
    withCredentials: true,
  });

/* --------------------------------------------------
   COMMUNITY MESSAGES
-------------------------------------------------- */
export const getCommunityMessages = (communityId, params = {}) =>
  api.get(`/api/community/getMessageIncomm/${communityId}`, {
    params,
    withCredentials: true,
  });

export const sendMessage = (communityId, formData) =>
  api.post(`/api/community/sendCommMess/${communityId}`, formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteMessage = (messageId) =>
  api.delete(`/api/community/deleteMessage/${messageId}`, {
    withCredentials: true,
  });

/* --------------------------------------------------
   MESSAGE INTERACTIONS
-------------------------------------------------- */
export const reactOnMessage = (messageId, emoji) =>
  api.patch(
    `/api/community/reactOnMessage/${messageId}`,
    { emoji },
    { withCredentials: true }
  );

export const messageHelpful = (messageId) =>
  api.patch(
    `/api/community/messageHelpful/${messageId}`,
    {},
    { withCredentials: true }
  );

export const voteOnPoll = (messageId, optionIds) =>
  api.post(
    `/api/community/vote/${messageId}`,
    { optionIds },
    { withCredentials: true }
  );

export const togglePinMessage = (messageId) =>
  api.post(
    `/api/community/pinMessage/${messageId}`,
    {},
    { withCredentials: true }
  );

export const getPinnedMessage = (communityId) =>
  api.get(`/api/community/pinnedMessage/${communityId}`, {
    withCredentials: true,
  });

export const reportMessage = (messageId, reason) =>
  api.post(
    `/api/community/reportMessage/${messageId}`,
    { reason },
    { withCredentials: true }
  );

/* --------------------------------------------------
   COMMENTS
-------------------------------------------------- */
export const getMessageComments = (messageId, params = {}) =>
  api.get(`/api/community/comments/${messageId}`, {
    params,
    withCredentials: true,
  });

export const createComment = (messageId, data) => {
  // Check if data is FormData (for media uploads) or plain object
  const isFormData = data instanceof FormData;

  return api.post(`/api/community/commentOnMsg/${messageId}`, data, {
    withCredentials: true,
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
};

export const deleteComment = (commentId) =>
  api.delete(`/api/community/deleteComment/${commentId}`, {
    withCredentials: true,
  });

export const reactOnComment = (commentId, emoji) =>
  api.patch(
    `/api/community/reactOnComment/${commentId}`,
    { emoji },
    { withCredentials: true }
  );

// export const commentHelpful = (commentId) =>
//   api.patch(
//     `/api/community/commentHelpful/${commentId}`,
//     {},
//     { withCredentials: true }
//   );

/* --------------------------------------------------
   USER-SPECIFIC
-------------------------------------------------- */
export const markCommunitySeen = (communityId) =>
  api.post(
    `/api/community/markAsSeen/${communityId}`,
    {},
    {
      withCredentials: true,
    }
  );

export const getMyHelpfulMessages = (communityId) =>
  api.get(`/api/community/helpfulMessages/${communityId}`, {
    withCredentials: true,
  });

export const getSimilarCommunities = (communityId, params = {}) =>
  api.get(`/api/community/similarCommunities/${communityId}`, {
    params,
    withCredentials: true,
  });
