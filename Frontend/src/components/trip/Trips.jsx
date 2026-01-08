import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Search, Plus, Calendar, MapPin, Users, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useGetMyTrips from "@/hooks/useGetMyTrips";
import { resetPagination, setPaginationMeta } from "@/redux/tripSlice";
import CreateTripModal from "./CreateTripModal";

/* ---------------- SEARCH BAR ---------------- */
const SearchBar = ({ value, onChange }) => (
  <div className="relative w-full md:max-w-md">
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      <Search className="text-gray-500" size={16} />
    </div>
    <input
      className="block w-full p-2 pl-9 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-teal-400 focus:border-teal-400 placeholder-gray-500"
      placeholder="Search destinations, dates, or trip names..."
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

/* ---------------- TRIP CARD ---------------- */
const TripCard = ({ trip, showAllButtons = false }) => {
  const navigate = useNavigate();

  console.log("Trips:", trip);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const buttons = showAllButtons
    ? [
        "Itinerary",
        "Wallet",
        "Members",
        "Gallery",
        "Destinations",
        "History",
        "Settings",
      ]
    : ["Gallery", "Itinerary", "History"];

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow trips-trip"
      onClick={() => navigate(`/trips/trip/${trip._id}`)}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <img
          alt={trip.title}
          className="w-full md:w-40 h-32 object-cover rounded-md shrink-0"
          src={
            trip.coverPhoto?.url ||
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400"
          }
        />
        <div className="flex-1 w-full">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {trip.title}
              </h3>
              <div className="flex items-center gap-1.5 text-gray-600 text-xs mt-0.5">
                <Calendar size={12} />
                <p>
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 flex-wrap">
            {/* LOCATION */}
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span>
                {trip.location?.city || "Location not set"},{" "}
                {trip.location?.state || "Location not set"},{" "}
                {trip.location?.country || "Location not set"}
              </span>
            </div>

            {/* MEMBERS */}
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>
                {trip.participants?.length || 0} member
                {trip.participants?.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* CREATED BY */}
            {trip.createdBy?.username && (
              <div className="flex items-center gap-1 text-gray-500">
                <span>by</span>
                <span>
                  {" "}
                  <User size={12} />{" "}
                </span>
                <span
                  className="font-medium text-gray-600 tripPlan-plannerName"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${trip.createdBy._id}`);
                  }}
                >
                  {trip.createdBy.username}
                </span>
              </div>
            )}

            {/* TYPE */}
            <span className="px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded-full text-xs font-medium capitalize">
              {trip.type || trip.status}
            </span>
          </div>

          {trip.description && (
            <p className="text-gray-600 text-xs mb-3 line-clamp-2">
              {trip.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {buttons.map((button, index) => (
              <button
                key={button}
                onClick={(e) => e.stopPropagation()}
                className={`flex items-center justify-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md transition-colors ${
                  index === 0 && showAllButtons
                    ? "bg-teal-400 text-gray-900 hover:bg-teal-500"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {button}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- TRIP SECTION ---------------- */
const TripSection = ({ title, trips, showAllButtons = false }) => {
  if (!trips || trips.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-gray-900 text-base font-bold mb-3">{title}</h2>
      <div className="space-y-4">
        {trips.map((trip) => (
          <TripCard
            key={trip._id}
            trip={trip}
            showAllButtons={showAllButtons}
          />
        ))}
      </div>
    </section>
  );
};

/* ---------------- EMPTY STATE (NO TRIPS AT ALL) ---------------- */
const EmptyState = ({ onCreateClick }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 mb-4 text-gray-300">
      <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <h3 className="text-base font-bold text-gray-900 mb-1">No trips yet</h3>
    <p className="text-gray-600 text-xs mb-4">
      Start planning your next adventure!
    </p>
    <button
      onClick={onCreateClick}
      className="flex items-center justify-center gap-2 h-9 px-4 bg-teal-400 text-gray-900 text-xs font-bold rounded-lg hover:bg-teal-500 transition-all shadow-sm"
    >
      <Plus size={16} />
      <span>Create Your First Trip</span>
    </button>
  </div>
);

/* ---------------- NO SEARCH RESULTS ---------------- */
const NoSearchResults = ({ searchQuery, onClearSearch }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 mb-4 text-gray-300">
      <Search size={48} />
    </div>
    <h3 className="text-base font-bold text-gray-900 mb-1">No trips found</h3>
    <p className="text-gray-600 text-xs mb-4">
      No trips match "{searchQuery}". Try different keywords.
    </p>
    <button
      onClick={onClearSearch}
      className="flex items-center justify-center gap-2 h-9 px-4 bg-gray-100 text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-200 transition-all"
    >
      Clear Search
    </button>
  </div>
);

/* ---------------- MAIN COMPONENT ---------------- */
const Trips = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    trips,
    pagination: { search, hasMore, totalTrips },
    loading,
    error,
  } = useSelector((s) => s.trip);

  const { loadMore, reload } = useGetMyTrips();

  /* ---------- DEBOUNCED SEARCH (SERVER-SIDE) ---------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(resetPagination());
      dispatch(setPaginationMeta({ search: searchInput }));
      reload({ searchOverride: searchInput });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ---------- RESOLVE TRIP OBJECTS FROM IDs ---------- */
  const tripList = trips.list.map((id) => trips.byId[id]).filter(Boolean);

  /* ---------- CATEGORIZE TRIPS (CLIENT-SIDE, POST-PAGINATION) ---------- */
  const categorizeTrips = (trips) => {
    if (!trips || trips.length === 0) {
      return { upcoming: [], ongoing: [], past: [] };
    }

    const now = new Date();
    const upcoming = [];
    const ongoing = [];
    const past = [];

    trips.forEach((trip) => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);

      if (end < now) {
        past.push(trip);
      } else if (start <= now && end >= now) {
        ongoing.push(trip);
      } else {
        upcoming.push(trip);
      }
    });

    return { upcoming, ongoing, past };
  };

  const { upcoming, ongoing, past } = categorizeTrips(tripList);

  /* ---------- CLEAR SEARCH HANDLER ---------- */
  const handleClearSearch = () => {
    setSearchInput("");
  };

  /* ---------- LOADING STATE ---------- */
  if (loading && !searchInput && tripList.length === 0) {
    return (
      <div className="w-full max-w-screen-xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 text-xs">Loading trips...</div>
        </div>
      </div>
    );
  }

  /* ---------- ERROR STATE ---------- */
  if (error && tripList.length === 0) {
    return (
      <div className="w-full max-w-screen-xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600 text-xs">Error: {error}</div>
        </div>
      </div>
    );
  }

  /* ---------- EMPTY STATE (USER HAS NO TRIPS AT ALL) ---------- */
  if (!loading && tripList.length === 0 && !searchInput && totalTrips === 0) {
    return (
      <div className="w-full max-w-screen-xl mx-auto p-4 lg:p-6">
        <h1 className="text-gray-900 text-xl font-bold mb-4">My Trips</h1>
        <EmptyState onCreateClick={() => setIsModalOpen(true)} />
        <CreateTripModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    );
  }

  /* ---------- RENDER TRIPS ---------- */
  return (
    <div className="w-full max-w-screen-xl mx-auto pt-0 px-4 pb-4 lg:pt-0 lg:px-12 lg:pb-5">
      <h1 className="text-gray-900 text-xl font-bold mb-2">My Trips</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
        <SearchBar value={searchInput} onChange={setSearchInput} />
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 h-9 px-4 bg-teal-400 text-gray-900 text-xs font-bold rounded-lg hover:bg-teal-500 transition-all shadow-sm w-full md:w-auto"
        >
          <Plus size={16} />
          <span>Create New Trip</span>
        </button>
      </div>

      {/* ---------- NO SEARCH RESULTS ---------- */}
      {!loading && tripList.length === 0 && searchInput && (
        <NoSearchResults
          searchQuery={searchInput}
          onClearSearch={handleClearSearch}
        />
      )}

      {/* ---------- TRIP SECTIONS ---------- */}
      {tripList.length > 0 && (
        <>
          <TripSection
            title="Upcoming"
            trips={upcoming}
            showAllButtons={true}
          />
          <TripSection title="Ongoing" trips={ongoing} showAllButtons={true} />
          <TripSection title="Past" trips={past} showAllButtons={false} />

          {/* ---------- LOAD MORE ---------- */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-4 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <CreateTripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Trips;
