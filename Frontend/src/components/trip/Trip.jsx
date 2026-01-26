// src/components/trip/Trip.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearTripGallery, setActiveTrip } from "@/redux/tripSlice";

import Itinerary from "@/components/trip/Itinerary";
import TripGallery from "./TripGallery";
import Wallet from "./wallet/Wallet";
import TripPlaces from "./places/TripPlaces";
import { getPublicTripPreview } from "@/api/trip";
import Members from "./members/Members";
import TripHistory from "./History/TripHistory";
import TripSettings from "./settings/TripSettings";

const TABS = [
  { key: "itinerary", label: "Plan / Itinerary" },
  { key: "wallet", label: "Wallet" },
  { key: "members", label: "Members" },
  { key: "gallery", label: "Gallery" },
  { key: "places", label: "Destinations" },
  { key: "history", label: "History" },
  { key: "settings", label: "Settings" },
];

const Trip = () => {
  const { tripId } = useParams();
  const dispatch = useDispatch();

  const { trips } = useSelector((s) => s.trip);
  const currentUserId = useSelector((s) => s.auth.user?._id);
  const tripRoles = useSelector((s) => s.trip.tripRoles[tripId] || []);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [publicPreview, setPublicPreview] = useState(null);

  const isMemberTrip = Boolean(trips.byId[tripId]);

  const activeTrip = useMemo(() => {
    return trips.byId[tripId] || publicPreview?.trip || null;
  }, [tripId, trips.byId, publicPreview]);

  // Permission checks
  const isOwner =
    activeTrip?.createdBy?._id?.toString() === currentUserId?.toString();
  console.log("Active Trip:", activeTrip);
  console.log("Is Owner:", isOwner);

  const hasRole = (roleName) => {
    return tripRoles.some(
      (r) =>
        r.roleName === roleName &&
        r.status === "active" &&
        (r.assignedTo?._id || r.assignedTo)?.toString() ===
          currentUserId?.toString(),
    );
  };

  const canManageSettings = isOwner || hasRole("Manager");

  useEffect(() => {
    if (tripId && isMemberTrip) {
      dispatch(setActiveTrip(tripId));
    }
  }, [tripId, isMemberTrip]);

  useEffect(() => {
    if (!tripId || isMemberTrip) return;

    getPublicTripPreview(tripId)
      .then((res) => setPublicPreview(res.data.data))
      .catch(() => setPublicPreview(null));
  }, [tripId, isMemberTrip]);

  useEffect(() => {
    return () => {
      if (tripId) {
        dispatch(clearTripGallery(tripId));
      }
    };
  }, [tripId]);

  if (!activeTrip) {
    return (
      <div className="p-4 sm:p-8 text-sm text-gray-500">
        Trip not found or still loading…
      </div>
    );
  }

  const coverImage =
    activeTrip.coverPhoto?.url ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200";

  const dateRange = `${new Date(activeTrip.startDate).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric" },
  )} - ${new Date(activeTrip.endDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="flex-1 p-0 px-4 sm:px-6 lg:px-8">
      {/* HERO - Responsive */}
      <div className="relative w-full h-48 sm:h-56 lg:h-64 rounded-xl overflow-hidden mb-4 sm:mb-6">
        <img
          src={coverImage}
          alt={activeTrip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 sm:p-6">
          <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold">
            {activeTrip.title}
          </h2>
          <p className="text-white/80 text-sm sm:text-base lg:text-lg">
            {dateRange}
          </p>
        </div>
      </div>

      {/* TABS - Responsive with scroll */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6">
        <nav className="flex space-x-4 sm:space-x-6 overflow-x-auto trip-tabs-nav">
          {TABS.map((tab) => {
            // Hide settings tab if user doesn't have permission
            if (tab.key === "settings" && !canManageSettings) {
              return null;
            }

            const restricted =
              !isMemberTrip &&
              ["wallet", "members", "gallery", "history", "settings"].includes(
                tab.key,
              );

            return (
              <button
                key={tab.key}
                disabled={restricted}
                onClick={() => !restricted && setActiveTab(tab.key)}
                className={`px-1 py-3 text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap
                  ${
                    activeTab === tab.key
                      ? "font-semibold border-teal-400 text-teal-500"
                      : "font-medium text-gray-500 border-transparent hover:text-teal-500 hover:border-teal-200"
                  }
                  ${restricted ? "opacity-40 cursor-not-allowed" : ""}
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* CONTENT */}
      <div className="text-sm text-gray-600 pb-6">
        {activeTab === "itinerary" && (
          <Itinerary
            publicPlans={!isMemberTrip ? publicPreview?.tripPlans : null}
          />
        )}

        {activeTab === "places" && (
          <TripPlaces
            tripId={tripId}
            publicPlaces={!isMemberTrip ? publicPreview?.tripPlaces : null}
          />
        )}

        {isMemberTrip && activeTab === "wallet" && <Wallet />}
        {isMemberTrip && activeTab === "gallery" && (
          <TripGallery tripId={tripId} />
        )}
        {isMemberTrip && activeTab === "members" && <Members />}
        {isMemberTrip && activeTab === "history" && <TripHistory />}
        {isMemberTrip && activeTab === "settings" && (
          <TripSettings tripId={tripId} />
        )}
      </div>
    </div>
  );
};

export default Trip;
