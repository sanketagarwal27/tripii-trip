// src/api/post.js
import api from "./axios.js";

export const getFeed = ({ page = 1, limit = 100 } = {}) =>
  api.get(`/api/post/getPosts?page=${page}&limit=${limit}`, {
    withCredentials: true,
  });

export const createPost = (formData) =>
  api.post("/api/post/createPost", formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const toggleLike = (postId) =>
  api.post(`/api/post/like/${postId}`, {}, { withCredentials: true });

export const addComment = (postId, text, parentCommentId = null) =>
  api.post(
    `/api/post/comment/${postId}`,
    { text, parentCommentId },
    { withCredentials: true }
  );

export const getCommentsByPost = (postId) =>
  api.get(`/api/post/comment/${postId}`, { withCredentials: true });

export const deletePost = (postId) =>
  api.delete(`/api/post/deletePost/${postId}`, { withCredentials: true });

export const getPostById = (postId) =>
  api.get(`/api/post/getPost/${postId}`, { withCredentials: true });

export const toggleBookmark = (postId) =>
  api.post(`/api/post/bookMark/${postId}`, {}, { withCredentials: true });

export const toggleCommentLike = (commentId) =>
  api.post(
    `/api/post/comment/like/${commentId}`,
    {},
    { withCredentials: true }
  );

export const deleteComment = (commentId) =>
  api.delete(`/api/post/comment/delete/${commentId}`, {
    withCredentials: true,
  });

export const getContextualPostLikes = (postId, limit = 5) =>
  api.get(`/api/post/${postId}/likes/contextual-likes?limit=${limit}`, {
    withCredentials: true,
  });
