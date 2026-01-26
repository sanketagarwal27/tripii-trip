import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  MapPin,
  Calendar,
  CheckCircle,
  DollarSign,
  Image,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Award,
  Globe,
  Clock,
  Users,
  RefreshCw,
} from "lucide-react";
import { getTripActivities } from "@/api/trip";

const TripHistory = () => {
  const { tripId } = useParams();

  const [activities, setActivities] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------------- FETCH TRIP DATA ---------------- */
  const fetchTripHistory = async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await getTripActivities(tripId);

      console.log("Trip history response:", res);
      const { trip, activities: fetchedActivities } = res.data.data;

      setActiveTrip(trip);

      // Activities should already be sorted by newest first from backend
      setActivities(fetchedActivities || []);
    } catch (err) {
      console.error("Failed to fetch trip history:", err);
      setError(err?.response?.data?.message || "Failed to load trip history");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetchTripHistory();
  }, [tripId]);

  /* ---------------- ACTIVITY ICON ---------------- */
  const getActivityIcon = (type) => {
    const iconMap = {
      trip_created: MapPin,
      plan_added: Calendar,
      plan_updated: Edit,
      checklist_added: CheckCircle,
      checklist_completed: CheckCircle,
      expense_added: DollarSign,
      expense_updated: Edit,
      expense_deleted: Trash2,
      photo_uploaded: Image,
      settlement_payer_confirmed: DollarSign,
      settlement_receiver_confirmed: DollarSign,
      settlement_completed: Award,
      trip_published_in_community: Globe,
      member_joined: UserPlus,
      member_left: UserMinus,
      role_assigned: Award,
      role_completed: CheckCircle,
    };
    return iconMap[type] || Clock;
  };

  /* ---------------- ACTIVITY COLOR ---------------- */
  const getActivityColor = (type) => {
    if (type.includes("expense") || type.includes("settlement"))
      return "text-green-600 bg-green-50";
    if (type.includes("member")) return "text-blue-600 bg-blue-50";
    if (type.includes("plan")) return "text-purple-600 bg-purple-50";
    if (type.includes("checklist")) return "text-teal-600 bg-teal-50";
    if (type.includes("photo")) return "text-pink-600 bg-pink-50";
    if (type.includes("role")) return "text-orange-600 bg-orange-50";
    return "text-gray-600 bg-gray-50";
  };

  /* ---------------- FORMAT TYPE ---------------- */
  const formatActivityType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  /* ---------------- FORMAT TIMESTAMP ---------------- */
  const formatTimestamp = (date) => {
    const activityDate = new Date(date);
    const now = new Date();
    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return activityDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        activityDate.getFullYear() !== now.getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  /* ---------------- FILTER CATEGORIES ---------------- */
  const filterCategories = [
    { key: "all", label: "All" },
    { key: "expense", label: "Financial" },
    { key: "member", label: "Members" },
    { key: "plan", label: "Planning" },
    { key: "checklist", label: "Tasks" },
  ];

  /* ---------------- FILTERED ACTIVITIES ---------------- */
  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    return activity.type.includes(filter);
  });

  /* ---------------- GUARDS ---------------- */
  if (!tripId) {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <p className="text-gray-500 text-sm md:text-base">Invalid trip</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 md:w-10 md:h-10 text-teal-500 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-sm md:text-base">
            Loading trip history...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-4">
        <p className="text-red-500 text-sm md:text-base mb-4 text-center">
          {error}
        </p>
        <button
          onClick={fetchTripHistory}
          className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <p className="text-gray-500 text-sm md:text-base text-center">
          Trip not found
        </p>
      </div>
    );
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Trip History
          </h2>
          <button
            onClick={fetchTripHistory}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <p className="text-gray-600 text-sm md:text-base">
          Track all activities and changes throughout your trip
        </p>
      </div>

      {/* Filter Tabs - Horizontal Scroll on Mobile */}
      <div className="mb-6 border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
          {filterCategories.map((category) => (
            <button
              key={category.key}
              onClick={() => setFilter(category.key)}
              className={`px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                filter === category.key
                  ? "text-teal-600 border-teal-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-base md:text-lg">
            No activities yet
          </p>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            {filter !== "all"
              ? "Try changing the filter"
              : "Start planning your trip to see activity here"}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line - Hidden on mobile, visible on md+ */}
          <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Activity items */}
          <div className="space-y-4 md:space-y-6">
            {filteredActivities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const colorClasses = getActivityColor(activity.type);

              return (
                <div key={activity._id || index} className="relative md:pl-20">
                  {/* Icon circle - Smaller on mobile */}
                  <div
                    className={`md:absolute md:left-0 mb-3 md:mb-0 w-12 h-12 md:w-16 md:h-16 rounded-full ${colorClasses} flex items-center justify-center shadow-sm mx-auto md:mx-0`}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>

                  {/* Content card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-1">
                          {formatActivityType(activity.type)}
                        </h3>
                        <p className="text-gray-600 text-xs md:text-sm leading-relaxed break-words">
                          {activity.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 md:gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                        <span className="font-medium truncate max-w-[150px] sm:max-w-none">
                          {activity.actor?.username || "Unknown User"}
                        </span>
                      </div>
                      <span className="text-gray-300 hidden sm:inline">•</span>
                      <div className="flex items-center gap-1 md:gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          {formatTimestamp(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      {filteredActivities.length > 0 && (
        <div className="mt-6 md:mt-8 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs md:text-sm">
            <span className="text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredActivities.length}
              </span>{" "}
              {filteredActivities.length === 1 ? "activity" : "activities"}
            </span>
            {filter !== "all" && (
              <span className="text-gray-500 text-xs md:text-sm">
                Filtered by:{" "}
                {filterCategories.find((c) => c.key === filter)?.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripHistory;
