import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  /* ---------------- META ---------------- */
  loading: false,
  error: null,

  pagination: {
    page: 1,
    limit: 15,
    hasMore: true,
    totalTrips: 0,
    search: "",
  },

  /* ---------------- TRIPS ---------------- */
  trips: {
    list: [],
    byId: {},
  },

  activeTripId: null,

  /* ---------------- RELATED DATA ---------------- */
  expenses: {},
  tripPlans: {},
  tripActivities: {},
  tripChecklists: {},
  tripClosures: {},
  tripPhotos: {}, // { [tripId]: Photo[] }
  tripPlaces: {},
  tripRoles: {},
  tripWallets: {},
};

const tripSlice = createSlice({
  name: "trip",
  initialState,
  reducers: {
    /* ================= META ================= */
    setTripLoading(state, action) {
      state.loading = action.payload;
    },

    setTripError(state, action) {
      state.error = action.payload;
    },

    clearTripError(state) {
      state.error = null;
    },

    /* ================= PAGINATION ================= */
    resetPagination(state) {
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },

    setPaginationMeta(state, action) {
      const { page, hasMore, totalTrips, search } = action.payload;

      if (page !== undefined) state.pagination.page = page;
      if (hasMore !== undefined) state.pagination.hasMore = hasMore;
      if (totalTrips !== undefined) state.pagination.totalTrips = totalTrips;
      if (search !== undefined) state.pagination.search = search;
    },

    /* ================= TRIPS ================= */
    setTrips(state, action) {
      const trips = action.payload;

      state.trips.list = trips.map((t) => t._id);

      trips.forEach((trip) => {
        state.trips.byId[trip._id] = trip;
      });
    },

    appendTrips(state, action) {
      const trips = action.payload;

      trips.forEach((trip) => {
        if (!state.trips.byId[trip._id]) {
          state.trips.list.push(trip._id);
        }
        state.trips.byId[trip._id] = trip;
      });
    },

    addTrip(state, action) {
      const trip = action.payload;
      state.trips.list.unshift(trip._id);
      state.trips.byId[trip._id] = trip;
    },

    removeTrip(state, action) {
      const tripId = action.payload;
      state.trips.list = state.trips.list.filter((id) => id !== tripId);
      delete state.trips.byId[tripId];
    },

    /* ================= ACTIVE TRIP ================= */
    setActiveTrip(state, action) {
      state.activeTripId = action.payload;
    },

    clearActiveTrip(state) {
      state.activeTripId = null;
    },

    /* ================= RELATED DATA ================= */
    hydrateTripData(state, action) {
      const {
        expenses = [],
        tripPlans = [],
        tripActivities = [],
        tripChecklists = [],
        tripClosures = [],
        tripPlaces = [],
        tripRoles = [],
        tripWallets = [],
      } = action.payload;

      // Clear existing data first
      state.expenses = {};
      state.tripPlans = {};
      state.tripActivities = {};
      state.tripChecklists = {};
      state.tripClosures = {};
      if (!state.tripPlaces) state.tripPlaces = {};
      state.tripRoles = {};
      state.tripWallets = {};

      const mapByTrip = (target, items) => {
        items.forEach((item) => {
          const tripId =
            typeof item.trip === "object" ? item.trip._id : item.trip;

          if (!target[tripId]) target[tripId] = [];

          const exists = target[tripId].some(
            (existing) => existing._id === item._id,
          );

          if (!exists) {
            target[tripId].push(item);
          }
        });
      };

      mapByTrip(state.expenses, expenses);
      mapByTrip(state.tripPlans, tripPlans);
      mapByTrip(state.tripActivities, tripActivities);
      mapByTrip(state.tripChecklists, tripChecklists);
      mapByTrip(state.tripClosures, tripClosures);

      /* ================= TRIP PLACES ================= */
      state.tripPlaces = {};

      tripPlaces.forEach((place) => {
        const tripId =
          typeof place.trip === "object" ? place.trip._id : place.trip;

        if (!state.tripPlaces[tripId]) {
          state.tripPlaces[tripId] = [];
        }

        state.tripPlaces[tripId].push(place);
      });

      /* ✅ Stable ordering (oldest → newest) */
      Object.keys(state.tripPlaces).forEach((tripId) => {
        state.tripPlaces[tripId].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
      });

      tripRoles.forEach((role) => {
        const tripId =
          typeof role.trip === "object" ? role.trip._id : role.trip;

        if (!state.tripRoles[tripId]) {
          state.tripRoles[tripId] = [];
        }

        const exists = state.tripRoles[tripId].some((r) => r._id === role._id);

        if (!exists) {
          state.tripRoles[tripId].push(role);
        }
      });

      tripWallets.forEach((wallet) => {
        const tripId =
          typeof wallet.trip === "object" ? wallet.trip._id : wallet.trip;
        state.tripWallets[tripId] = wallet;
      });
    },

    addTripPlan(state, action) {
      const plan = action.payload;
      const tripId = typeof plan.trip === "object" ? plan.trip._id : plan.trip;

      if (!state.tripPlans[tripId]) {
        state.tripPlans[tripId] = [];
      }

      state.tripPlans[tripId].push(plan);

      // Keep plans ordered by date + sequence
      state.tripPlans[tripId].sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        return a.sequence - b.sequence;
      });
    },

    clearTripSession(state) {
      state.loading = false;
      state.error = null;
      state.activeTripId = null;
    },
    reorderTripPlansOptimistic(state, action) {
      const { tripId, date, orderedPlanIds } = action.payload;

      if (!state.tripPlans[tripId]) return;

      const day = new Date(date).toISOString().split("T")[0];

      const sameDayPlans = [];
      const otherPlans = [];

      state.tripPlans[tripId].forEach((plan) => {
        const planDay = new Date(plan.date).toISOString().split("T")[0];
        if (planDay === day) sameDayPlans.push(plan);
        else otherPlans.push(plan);
      });

      const planMap = {};
      sameDayPlans.forEach((p) => {
        planMap[p._id] = p;
      });

      const reordered = orderedPlanIds.map((id, index) => ({
        ...planMap[id],
        sequence: index + 1,
      }));

      state.tripPlans[tripId] = [...otherPlans, ...reordered];

      state.tripPlans[tripId].sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        return a.sequence - b.sequence;
      });
    },

    updateTripPlan(state, action) {
      const updatedPlan = action.payload;
      const tripId =
        typeof updatedPlan.trip === "object"
          ? updatedPlan.trip._id
          : updatedPlan.trip;

      if (!state.tripPlans[tripId]) return;

      const idx = state.tripPlans[tripId].findIndex(
        (p) => p._id === updatedPlan._id,
      );

      if (idx !== -1) {
        state.tripPlans[tripId][idx] = updatedPlan;
      }
    },

    removeTripPlan(state, action) {
      const { tripId, planId } = action.payload;

      if (!state.tripPlans[tripId]) return;

      state.tripPlans[tripId] = state.tripPlans[tripId].filter(
        (p) => p._id !== planId,
      );
    },

    /* ================= TRIP PHOTOS ================= */

    /**
     * ✅ FIXED: Replaces entire photo array for a trip
     * Used after fetching from API to ensure clean state
     */
    addTripPhotos(state, action) {
      const { tripId, photos, replace = false } = action.payload;

      if (replace) {
        state.tripPhotos[tripId] = photos;
        return;
      }
      if (!tripId) return;

      const list = Array.isArray(photos) ? photos : photos ? [photos] : [];
      if (!list.length) return;

      // ✅ Create a Set of existing photo IDs for O(1) lookup
      const existingIds = new Set(
        (state.tripPhotos[tripId] || []).map((p) => p._id),
      );

      // ✅ Only add truly new photos
      const newPhotos = list.filter((photo) => {
        if (!photo?._id) return false;
        return !existingIds.has(photo._id);
      });

      if (newPhotos.length === 0) return;

      if (!state.tripPhotos[tripId]) {
        state.tripPhotos[tripId] = [];
      }

      // ✅ Add new photos at the beginning (newest first)
      state.tripPhotos[tripId] = [...newPhotos, ...state.tripPhotos[tripId]];

      // ✅ Sort by createdAt (newest first)
      state.tripPhotos[tripId].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    },

    /**
     * ✅ DEPRECATED: Use addTripPhotos instead
     * Kept for backward compatibility
     */
    addTripPhoto(state, action) {
      const photo = action.payload;
      const tripId =
        typeof photo.trip === "object" ? photo.trip._id : photo.trip;

      if (!state.tripPhotos[tripId]) {
        state.tripPhotos[tripId] = [];
      }

      const exists = state.tripPhotos[tripId].some((p) => p._id === photo._id);

      if (!exists) {
        state.tripPhotos[tripId].unshift(photo);
      }
    },

    clearTripGallery(state, action) {
      const tripId = action.payload;
      delete state.tripPhotos[tripId];
    },
    /**
     * ✅ Removes photo from Redux state
     */
    removeTripPhoto: (state, action) => {
      const { tripId, photoId } = action.payload;
      if (!state.tripPhotos[tripId]) return;
      state.tripPhotos[tripId] = state.tripPhotos[tripId].filter(
        (p) => p._id !== photoId,
      );
    },
    /**
     * ✅ Updates photo visibility (for push to global)
     */
    updateTripPhotoVisibility(state, action) {
      const { tripId, photoId, visibility } = action.payload;

      if (!state.tripPhotos[tripId]) return;

      const photo = state.tripPhotos[tripId].find((p) => p._id === photoId);
      if (photo) {
        state.tripPhotos[tripId] = state.tripPhotos[tripId].map((p) =>
          p._id === photoId ? { ...p, visibility } : p,
        );
      }
    },
    updateTripPhoto(state, action) {
      const { tripId, photoId, updates } = action.payload;

      if (!state.tripPhotos[tripId]) return;

      state.tripPhotos[tripId] = state.tripPhotos[tripId].map((p) =>
        p._id === photoId ? { ...p, ...updates } : p,
      );
    },

    // for trip places
    addTripPlace(state, action) {
      const place = action.payload;
      const tripId =
        typeof place.trip === "object" ? place.trip._id : place.trip;

      if (!state.tripPlaces[tripId]) {
        state.tripPlaces[tripId] = [];
      }

      const exists = state.tripPlaces[tripId].some((p) => p._id === place._id);

      if (!exists) {
        state.tripPlaces[tripId].push(place);
      }
    },

    removeTripPlace(state, action) {
      const { tripId, placeId } = action.payload;

      if (!state.tripPlaces[tripId]) return;

      state.tripPlaces[tripId] = state.tripPlaces[tripId].filter(
        (p) => p._id !== placeId,
      );
    },

    updateTripField(state, action) {
      const { tripId, field, value } = action.payload;
      if (state.trips.byId[tripId]) {
        state.trips.byId[tripId][field] = value;
      }
    },

    updateTrip(state, action) {
      const trip = action.payload;
      if (state.trips.byId[trip._id]) {
        state.trips.byId[trip._id] = {
          ...state.trips.byId[trip._id],
          ...trip,
        };
      }
    },

    removeTripParticipant(state, action) {
      const { tripId, userId } = action.payload;
      const trip = state.trips.byId[tripId];

      if (trip?.participants) {
        const participantIndex = trip.participants.findIndex((p) => {
          const pUserId = p.user?._id || p.user;
          return pUserId?.toString() === userId?.toString();
        });

        if (participantIndex !== -1) {
          trip.participants[participantIndex].status = "removed";
          trip.participants[participantIndex].removedAt =
            new Date().toISOString();
        }
      }
    },

    updateParticipantStatus(state, action) {
      const { tripId, userId, status } = action.payload;
      const trip = state.trips.byId[tripId];

      if (trip?.participants) {
        const participant = trip.participants.find((p) => {
          const pUserId = p.user?._id || p.user;
          return pUserId?.toString() === userId?.toString();
        });

        if (participant) {
          participant.status = status;
          if (status === "left") {
            participant.leftAt = new Date().toISOString();
          }
        }
      }
    },

    addTripRole(state, action) {
      const { tripId, role } = action.payload;

      if (!state.tripRoles[tripId]) {
        state.tripRoles[tripId] = [];
      }

      const exists = state.tripRoles[tripId].some((r) => r._id === role._id);
      if (!exists) {
        state.tripRoles[tripId].push(role);
      }
    },

    removeTripRole(state, action) {
      const { tripId, roleId } = action.payload;

      if (state.tripRoles[tripId]) {
        state.tripRoles[tripId] = state.tripRoles[tripId].filter(
          (r) => r._id !== roleId,
        );
      }
    },

    removeUserRoles(state, action) {
      const { tripId, userId } = action.payload;

      if (state.tripRoles[tripId]) {
        state.tripRoles[tripId] = state.tripRoles[tripId].filter((role) => {
          const assignedId = role.assignedTo?._id || role.assignedTo;
          return assignedId?.toString() !== userId?.toString();
        });
      }
    },
  },
});

export const {
  setTripLoading,
  setTripError,
  clearTripError,
  resetPagination,
  setPaginationMeta,
  setTrips,
  appendTrips,
  addTrip,
  removeTrip,
  setActiveTrip,
  clearActiveTrip,
  hydrateTripData,
  clearTripSession,
  addTripPlan,
  reorderTripPlansOptimistic,
  updateTripPlan,
  removeTripPlan,
  addTripPhoto,
  clearTripGallery,
  addTripPhotos,
  removeTripPhoto,
  updateTripPhotoVisibility,
  updateTripPhoto,
  addTripPlace,
  removeTripPlace,

  updateTripField,
  updateTrip,
  removeTripParticipant,
  updateParticipantStatus,
  addTripRole,
  removeTripRole,
  removeUserRoles,
} = tripSlice.actions;

export default tripSlice.reducer;
