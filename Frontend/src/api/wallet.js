// src/api/wallet.js
import api from "./axios";

/* ================= WALLET CORE ================= */

// Get wallet summary
export const getTripWallet = (tripId) =>
  api.get(`/api/trip/trips/${tripId}/wallet`, {
    withCredentials: true,
  });

// Update wallet settings
export const updateWalletSettings = (tripId, payload) =>
  api.patch(`/api/trip/trips/${tripId}/wallet/settings`, payload, {
    withCredentials: true,
  });

/* ================= EXPENSES ================= */

// Add new expense
export const addExpense = (tripId, payload) =>
  api.post(`/api/trip/trips/${tripId}/wallet/expenses`, payload, {
    withCredentials: true,
  });

// Get all wallet expenses
export const getWalletExpenses = (tripId) =>
  api.get(`/api/trip/trips/${tripId}/wallet/expenses`, {
    withCredentials: true,
  });

// Update an expense
export const updateExpense = (expenseId, payload) =>
  api.patch(`/api/trip/wallet/expenses/${expenseId}`, payload, {
    withCredentials: true,
  });

// Delete an expense
export const deleteExpense = (expenseId) =>
  api.delete(`/api/trip/wallet/expenses/${expenseId}`, {
    withCredentials: true,
  });

/* ================= SETTLEMENTS ================= */

// Generate settlements
export const generateSettlements = (tripId) =>
  api.post(
    `/api/trip/trips/${tripId}/wallet/settlements/generate`,
    {},
    { withCredentials: true }
  );

// Confirm settlement
export const confirmSettlement = (tripId, settlementId, type) =>
  api.post(
    `/api/trip/trips/${tripId}/wallet/settlements/${settlementId}/confirm/${type}`,
    {},
    { withCredentials: true }
  );

/* ================= ACCOUNTANTS ================= */

// Assign accountant
export const assignAccountant = (tripId, payload) =>
  api.post(`/api/trip/trips/${tripId}/wallet/accountants`, payload, {
    withCredentials: true,
  });

// Remove accountant
export const removeAccountant = (tripId, userId) =>
  api.delete(`/api/trip/trips/${tripId}/wallet/accountants/${userId}`, {
    withCredentials: true,
  });

export const setPersonalBudget = (tripId, budget) =>
  api.post(
    `/api/trip/trips/${tripId}/wallet/personal-budget`,
    { budget },
    { withCredentials: true }
  );

export const setTripBudget = (tripId, budget) =>
  api.patch(
    `/api/trip/trips/${tripId}/wallet/budget`,
    { budget },
    { withCredentials: true }
  );
