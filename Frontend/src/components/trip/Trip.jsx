// src/components/trip/Trip.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearTripGallery, setActiveTrip } from "@/redux/tripSlice";
import Itinerary from "@/components/trip/Itinerary";
import TripGallery from "./TripGallery";
import Wallet from "./wallet/Wallet";

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
  const [activeTab, setActiveTab] = useState("itinerary");

  const { trips } = useSelector((s) => s.trip);

  useEffect(() => {
    return () => {
      if (tripId) {
        dispatch(clearTripGallery(tripId));
      }
    };
  }, [tripId]);

  /* ---------------- ATOMIC DERIVATION ---------------- */
  const activeTrip = useMemo(() => {
    return trips.byId[tripId] || null;
  }, [tripId, trips.byId]);

  useEffect(() => {
    if (tripId) {
      dispatch(setActiveTrip(tripId));
    }
  }, [tripId]);

  /* ---------------- GUARD ---------------- */
  if (!activeTrip) {
    return (
      <div className="p-8 text-sm text-gray-500">
        Trip not found or still loading…
      </div>
    );
  }

  /* ---------------- DERIVED DATA (SYNC) ---------------- */
  const coverImage =
    activeTrip.coverPhoto?.url ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200";

  const dateRange = `${new Date(activeTrip.startDate).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
    }
  )} - ${new Date(activeTrip.endDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  /* ---------------- UI ---------------- */
  return (
    <div className="flex-1 p-0 lg:px-8">
      {/* ---------- HERO ---------- */}
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

      {/* ---------- TABS ---------- */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-1 py-3 text-sm border-b-2 transition-all
            ${
              isActive
                ? "font-semibold border-teal-400 text-teal-500"
                : "font-medium text-gray-500 border-transparent hover:text-teal-500 hover:border-teal-200"
            }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ---------- PLACEHOLDER CONTENT (WIRED, NOT IMPLEMENTED) ---------- */}
      <div className="text-sm text-gray-600">
        {activeTab === "itinerary" && <Itinerary />}
        {activeTab === "wallet" && <Wallet />}
        {activeTab === "members" && "Members content goes here"}
        {activeTab === "gallery" && <TripGallery tripId={tripId} />}

        {activeTab === "places" && "Famous places content goes here"}
        {activeTab === "history" && "History content goes here"}
        {activeTab === "settings" && "Settings content goes here"}
      </div>
    </div>
  );
};

export default Trip;
