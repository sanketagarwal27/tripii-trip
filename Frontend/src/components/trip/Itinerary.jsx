import { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Shuffle,
  Check,
  X,
  MapPin,
} from "lucide-react";
import { reorderTripPlans } from "@/api/trip";
import { reorderTripPlansOptimistic } from "@/redux/tripSlice";
import CreateTripPlanModal from "./CreateTripPlanModal";
import EditTripPlanModal from "./EditTripPlanModal";
import { useNavigate } from "react-router-dom";
import { deleteItineraryPlan } from "@/api/trip";
import { removeTripPlan } from "@/redux/tripSlice";

/* ---------------- UTILS ---------------- */
const formatDayTitle = (dateStr, index) => {
  const d = new Date(dateStr);
  return `Day ${index + 1} :- ${d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })}`;
};

const timeToMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/* ======================================================
   ITINERARY
====================================================== */
const Itinerary = ({ publicPlans }) => {
  const EMPTY_ARRAY = [];
  const EMPTY_OBJECT = null;
  const dispatch = useDispatch();

  const activeTripId = useSelector((s) => s.trip.activeTripId);

  const reduxPlans = useSelector(
    (s) => s.trip.tripPlans[activeTripId] || EMPTY_ARRAY,
  );

  const tripRoles = useSelector((s) => s.trip.tripRoles[activeTripId] || []);

  const tripPlans = publicPlans ?? reduxPlans;

  const currentUserId = useSelector((s) => s.auth.user?._id || EMPTY_OBJECT);

  const activeTrip = useSelector(
    (s) => s.trip.trips.byId[activeTripId] || EMPTY_OBJECT,
  );

  const navigate = useNavigate();

  const [shuffleDate, setShuffleDate] = useState(null);
  const [localPlans, setLocalPlans] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  console.log("Active TRip roles:", activeTrip);

  const canManageTrip = useMemo(() => {
    if (!currentUserId || !activeTrip) return false;

    // Owner check
    const ownerId =
      typeof activeTrip.createdBy === "object"
        ? activeTrip.createdBy._id
        : activeTrip.createdBy;

    if (ownerId?.toString() === currentUserId?.toString()) return true;

    // ✅ Planner role check (CORRECT SOURCE)
    return tripRoles.some((r) => {
      const assignedId = r.assignedTo?._id || r.assignedTo;
      return (
        r.roleName === "Planner" &&
        r.status === "active" &&
        assignedId?.toString() === currentUserId?.toString()
      );
    });
  }, [activeTrip, currentUserId, tripRoles]);

  /* ---------------- GROUP BY DATE ---------------- */
  const plansByDate = useMemo(() => {
    const map = {};
    tripPlans.forEach((plan) => {
      const key = new Date(plan.date).toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(plan);
    });

    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => a.sequence - b.sequence),
    );

    return Object.entries(map).sort(([a], [b]) => new Date(a) - new Date(b));
  }, [tripPlans]);

  /* To check conflicts of time */
  const conflictPlanIds = useMemo(() => {
    const conflicts = new Set();

    plansByDate.forEach(([_, plans]) => {
      for (let i = 0; i < plans.length; i++) {
        const a = plans[i];
        const aStart = timeToMinutes(a.time?.start);
        const aEnd = timeToMinutes(a.time?.end);

        if (aStart == null || aEnd == null) continue;

        for (let j = i + 1; j < plans.length; j++) {
          const b = plans[j];
          const bStart = timeToMinutes(b.time?.start);
          const bEnd = timeToMinutes(b.time?.end);

          if (bStart == null || bEnd == null) continue;

          // 🔴 OVERLAP CONDITION
          if (aStart < bEnd && bStart < aEnd) {
            conflicts.add(a._id);
            conflicts.add(b._id);
          }
        }
      }
    });

    return conflicts;
  }, [plansByDate]);

  /* ---------------- SHUFFLE ---------------- */
  const startShuffle = (date, plans) => {
    setShuffleDate(date);
    setLocalPlans([...plans]);
  };

  const cancelShuffle = () => {
    setShuffleDate(null);
    setLocalPlans([]);
  };

  const movePlan = (index, dir) => {
    const updated = [...localPlans];
    const target = index + dir;
    if (target < 0 || target >= updated.length) return;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setLocalPlans(updated);
  };

  const saveShuffle = async () => {
    const orderedPlanIds = localPlans.map((p) => p._id);

    dispatch(
      reorderTripPlansOptimistic({
        tripId: activeTripId,
        date: shuffleDate,
        orderedPlanIds,
      }),
    );

    try {
      await reorderTripPlans(activeTripId, {
        date: shuffleDate,
        orderedPlanIds,
      });
    } catch (err) {
      console.error("Reorder failed", err);
    }

    cancelShuffle();
  };

  const handleDelete = async (planId) => {
    if (!confirm("Delete this activity?")) return;

    dispatch(
      removeTripPlan({
        tripId: activeTripId,
        planId,
      }),
    );

    try {
      await deleteItineraryPlan(planId);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  /* ---------------- PERMISSION CHECK ---------------- */
  const canEditPlan = (plan) => {
    if (!currentUserId || !activeTrip) return false;

    // Owner or planner can edit any plan
    if (canManageTrip) return true;

    // Otherwise only plan creator
    const planCreatorId =
      typeof plan.createdBy === "object" ? plan.createdBy._id : plan.createdBy;

    return planCreatorId === currentUserId;
  };

  /* ---------------- EMPTY STATE ---------------- */
  if (!tripPlans.length) {
    return (
      <div className="flex flex-col items-center py-28">
        <p className="text-gray-500 text-base">
          No plans yet. Start building your itinerary.
        </p>
        {canManageTrip && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 h-11 bg-teal-400 text-gray-900 rounded-lg text-sm font-bold hover:bg-teal-500"
          >
            + Add Activity
          </button>
        )}

        {showCreate && (
          <CreateTripPlanModal
            tripId={activeTripId}
            onClose={() => setShowCreate(false)}
          />
        )}
      </div>
    );
  }

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div className="space-y-8">
      {showCreate && (
        <CreateTripPlanModal
          tripId={activeTripId}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingPlan && (
        <EditTripPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
        />
      )}

      {canManageTrip && (
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 h-11 bg-teal-400 text-gray-900 rounded-lg text-sm font-bold hover:bg-teal-500"
        >
          + Add Activity
        </button>
      )}

      {plansByDate.map(([date, plans], dayIndex) => {
        const isShuffle = shuffleDate === date;
        const visiblePlans = isShuffle ? localPlans : plans;

        return (
          <div key={date}>
            {/* DAY HEADER */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-teal-400 text-white font-bold flex items-center justify-center text-sm shadow">
                  {dayIndex + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {formatDayTitle(date, dayIndex)}
                </h3>
              </div>

              {canManageTrip && !isShuffle && (
                <button
                  onClick={() => startShuffle(date, plans)}
                  className="flex items-center gap-2 text-sm font-semibold text-teal-500 hover:underline"
                >
                  <Shuffle size={16} /> Reorder
                </button>
              )}

              {canManageTrip && isShuffle && (
                <div className="flex gap-2">
                  <button
                    onClick={saveShuffle}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-teal-400 text-white text-sm font-bold"
                  >
                    <Check size={14} /> Save
                  </button>
                  <button
                    onClick={cancelShuffle}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-200 text-sm font-bold"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>

            {/* TIMELINE */}
            <div className="relative ml-4">
              <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-teal-400 rounded-full" />

              <div className="space-y-4">
                {visiblePlans.map((plan, index) => (
                  <div
                    key={plan._id}
                    className="flex items-stretch gap-6 relative group"
                  >
                    {/* TIMELINE COLUMN */}
                    <div className="relative flex flex-col items-center w-8">
                      <div className="flex-1 flex items-center">
                        <div className="size-3 bg-teal-400 rounded-full z-10" />
                      </div>

                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        width="40"
                        height="40"
                        viewBox="0 0 40 40"
                        fill="none"
                      >
                        <path
                          d="M0 20 C0 20 40 20 40 20"
                          stroke="#2dd4bf"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    </div>

                    {/* CARD */}
                    <div className="flex-1">
                      {conflictPlanIds.has(plan._id) && (
                        <p className="text-xs text-red-500 font-semibold">
                          ⚠ Time conflict
                        </p>
                      )}

                      <div
                        className={`bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition
    ${
      conflictPlanIds.has(plan._id)
        ? "border-2 border-red-500"
        : "border border-transparent"
    }
  `}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-gray-900">
                              {plan.title}
                            </p>

                            {plan.time?.start && (
                              <p className="text-sm text-teal-500 font-medium">
                                {plan.time.start}
                                {plan.time.end ? ` – ${plan.time.end}` : ""}
                              </p>
                            )}

                            {plan.description && (
                              <p className="text-sm text-gray-600 leading-snug">
                                {plan.description}
                              </p>
                            )}

                            {(plan.location?.name ||
                              plan.createdBy?.username) && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {plan.location?.name && (
                                  <>
                                    <MapPin size={12} />
                                    <span>{plan.location.name}</span>
                                  </>
                                )}

                                {plan.createdBy?.username && (
                                  <span className="text-gray-400">
                                    • by{" "}
                                    <span
                                      className="font-medium text-gray-600 tripPlan-plannerName"
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        navigate(
                                          `/profile/${plan?.createdBy?._id}`,
                                        )
                                      }
                                    >
                                      {plan.createdBy.username}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            {/* SHUFFLE ARROWS (ONLY IN SHUFFLE MODE) */}
                            {isShuffle && (
                              <div className="flex flex-col mr-1">
                                <button
                                  onClick={() => movePlan(index, -1)}
                                  className="p-1 text-black-400 hover:text-teal-500 disabled:opacity-30"
                                  disabled={index === 0}
                                >
                                  <ArrowUp size={16} />
                                </button>

                                <button
                                  onClick={() => movePlan(index, 1)}
                                  className="p-1 text-black-400 hover:text-teal-500 disabled:opacity-30"
                                  disabled={index === visiblePlans.length - 1}
                                >
                                  <ArrowDown size={16} />
                                </button>
                              </div>
                            )}

                            {/* EDIT */}
                            {canEditPlan(plan) && (
                              <button
                                onClick={() => setEditingPlan(plan)}
                                className="p-1 text-black-400 hover:text-teal-500"
                              >
                                <Pencil size={16} />
                              </button>
                            )}

                            {/* DELETE */}
                            {canEditPlan(plan) && (
                              <button
                                onClick={() => handleDelete(plan._id)}
                                className="p-1 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Itinerary;
