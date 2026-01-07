import { createSlice } from "@reduxjs/toolkit";

const walletSlice = createSlice({
  name: "wallet",
  initialState: {
    // tripId -> wallet data
    wallets: {},
  },

  reducers: {
    /* ================= SET / RESET ================= */

    setTripWallet: (state, action) => {
      const {
        tripId,
        wallet,
        participants = [],
        expenses,
        settlements,
        permissions,
      } = action.payload;

      state.wallets[tripId] = {
        wallet,
        participants, // ✅ now available everywhere
        expenses: expenses || [],
        settlements: settlements || [],
        permissions: permissions || {},
      };
    },

    clearTripWallet: (state, action) => {
      const tripId = action.payload;
      if (!tripId) return;

      delete state.wallets[tripId];
    },

    /* ================= EXPENSES ================= */

    addWalletExpense: (state, action) => {
      const { tripId, expense } = action.payload || {};
      if (!tripId || !expense) return;

      if (!state.wallets[tripId]) {
        state.wallets[tripId] = {
          wallet: { totalSpend: 0, budget: 0 },
          expenses: [],
          settlements: [],
          permissions: {},
        };
      }

      state.wallets[tripId].expenses.unshift(expense);
      state.wallets[tripId].wallet.totalSpend += expense.amount || 0;
    },

    updateWalletExpense: (state, action) => {
      const { tripId, expense } = action.payload || {};
      if (!state.wallets[tripId] || !expense) return;

      const expenses = state.wallets[tripId].expenses;
      const index = expenses.findIndex((e) => e._id === expense._id);

      if (index === -1) return;

      const prevAmount = expenses[index].amount || 0;
      state.wallets[tripId].wallet.totalSpend -= prevAmount;
      state.wallets[tripId].wallet.totalSpend += expense.amount || 0;

      expenses[index] = expense;
    },

    removeWalletExpense: (state, action) => {
      const { tripId, expenseId } = action.payload || {};
      if (!state.wallets[tripId]) return;

      const expenses = state.wallets[tripId].expenses;
      const index = expenses.findIndex((e) => e._id === expenseId);

      if (index === -1) return;

      state.wallets[tripId].wallet.totalSpend -= expenses[index].amount || 0;
      expenses.splice(index, 1);
    },

    /* ================= SETTINGS ================= */

    updateWalletSettings: (state, action) => {
      const { tripId, settings, budget } = action.payload || {};
      if (!state.wallets[tripId]) return;

      if (settings) {
        state.wallets[tripId].wallet.settings = {
          ...state.wallets[tripId].wallet.settings,
          ...settings,
        };
      }

      if (budget !== undefined) {
        state.wallets[tripId].wallet.budget = budget;
      }
    },

    /* ================= SETTLEMENTS ================= */

    setSettlements: (state, action) => {
      const { tripId, settlements } = action.payload || {};
      if (!state.wallets[tripId]) return;

      state.wallets[tripId].settlements = Array.isArray(settlements)
        ? settlements
        : [];
    },

    updateSettlement: (state, action) => {
      const { tripId, index, settlement } = action.payload || {};
      if (!state.wallets[tripId]) return;

      if (state.wallets[tripId].settlements?.[index]) {
        state.wallets[tripId].settlements[index] = settlement;
      }
    },

    /* ================= PERMISSIONS ================= */

    updateWalletPermissions: (state, action) => {
      const { tripId, permissions } = action.payload || {};
      if (!state.wallets[tripId] || !permissions) return;

      state.wallets[tripId].permissions = {
        ...state.wallets[tripId].permissions,
        ...permissions,
      };
    },

    updatePersonalBudget(state, action) {
      const { tripId, userId, personalBudget } = action.payload;

      const wallet = state.wallets[tripId];
      if (!wallet) return;

      const participant = wallet.participants.find((p) => p._id === userId);

      if (participant) {
        participant.personalBudget = personalBudget;
      }
    },
  },
});

export const {
  setTripWallet,
  clearTripWallet,

  addWalletExpense,
  updateWalletExpense,
  removeWalletExpense,

  updateWalletSettings,

  setSettlements,
  updateSettlement,

  updateWalletPermissions,
  updatePersonalBudget,
} = walletSlice.actions;

export default walletSlice.reducer;
