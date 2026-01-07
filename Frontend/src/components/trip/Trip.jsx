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

const TABS = [
  { key: "itinerary", label: "Plan / Itinerary" },
  { key: "wallet", label: "Wallet" },
  { key: "members", label: "Members" },
  { key: "gallery", label: "Gallery" },
  { key: "places", label: "Famous Places" },
  { key: "history", label: "History" },
  { key: "settings", label: "Settings" },
];

const Trip = () => {
  const { tripId } = useParams();
  const dispatch = useDispatch();

  const { trips } = useSelector((s) => s.trip);
  const [activeTab, setActiveTab] = useState("itinerary");

  // 🔓 public preview state (ONLY used when user is not a member)
  const [publicPreview, setPublicPreview] = useState(null);

  /* ---------------- MEMBER CHECK ---------------- */
  const isMemberTrip = Boolean(trips.byId[tripId]);

  /* ---------------- ACTIVE TRIP ---------------- */
  const activeTrip = useMemo(() => {
    return trips.byId[tripId] || publicPreview?.trip || null;
  }, [tripId, trips.byId, publicPreview]);

  /* ---------------- SET ACTIVE TRIP (MEMBERS ONLY) ---------------- */
  useEffect(() => {
    if (tripId && isMemberTrip) {
      dispatch(setActiveTrip(tripId));
    }
  }, [tripId, isMemberTrip]);

  /* ---------------- PUBLIC PREVIEW FETCH ---------------- */
  useEffect(() => {
    if (!tripId || isMemberTrip) return;

    getPublicTripPreview(tripId)
      .then((res) => setPublicPreview(res.data.data))
      .catch(() => setPublicPreview(null));
  }, [tripId, isMemberTrip]);

  /* ---------------- CLEANUP ---------------- */
  useEffect(() => {
    return () => {
      if (tripId) {
        dispatch(clearTripGallery(tripId));
      }
    };
  }, [tripId]);

  /* ---------------- GUARD ---------------- */
  if (!activeTrip) {
    return (
      <div className="p-8 text-sm text-gray-500">
        Trip not found or still loading…
      </div>
    );
  }

  /* ---------------- DERIVED UI DATA ---------------- */
  const coverImage =
    activeTrip.coverPhoto?.url ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200";

  const dateRange = `${new Date(activeTrip.startDate).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric" }
  )} - ${new Date(activeTrip.endDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  /* ---------------- UI ---------------- */
  return (
    <div className="flex-1 p-0 lg:px-8">
      {/* HERO */}
      <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6">
        <img
          src={coverImage}
          alt={activeTrip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <h2 className="text-white text-4xl font-bold">{activeTrip.title}</h2>
          <p className="text-white/80 text-lg">{dateRange}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-6">
          {TABS.map((tab) => {
            const restricted =
              !isMemberTrip &&
              ["wallet", "members", "gallery", "history", "settings"].includes(
                tab.key
              );

            return (
              <button
                key={tab.key}
                disabled={restricted}
                onClick={() => !restricted && setActiveTab(tab.key)}
                className={`px-1 py-3 text-sm border-b-2 transition-all
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
      <div className="text-sm text-gray-600">
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
        {isMemberTrip && activeTab === "members" && "Members content goes here"}
        {isMemberTrip && activeTab === "history" && "History content goes here"}
        {isMemberTrip &&
          activeTab === "settings" &&
          "Settings content goes here"}
      </div>
    </div>
  );
};

export default Trip;
