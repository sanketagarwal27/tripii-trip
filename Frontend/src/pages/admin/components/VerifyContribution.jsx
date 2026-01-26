import React, { useState, useEffect } from "react";
import { Check, X, RotateCcw, MapPin, Star } from "lucide-react";
import PlaceDetailModal from "./PlaceDetailsModal";
import {
  getAllContributions,
  approveContribution,
  rejectContribution,
  setContributionToPending,
} from "@/api/admin";

const VerifyContributions = () => {
  const [contributions, setContributions] = useState([]);
  const [currentTab, setCurrentTab] = useState("Pending");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllContributions();
        setContributions(data.data || []);
      } catch (error) {
        console.error("Failed to fetch contributions", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateStatus = async (id, newStatus) => {
    setContributions((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, status: newStatus } : item,
      ),
    );

    try {
      if (newStatus === "Approved") await approveContribution(id);
      else if (newStatus === "Rejected") await rejectContribution(id);
      else await setContributionToPending(id);
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const counts = {
    Pending: contributions.filter((c) => c.status === "Pending").length,
    Approved: contributions.filter((c) => c.status === "Approved").length,
    Rejected: contributions.filter((c) => c.status === "Rejected").length,
  };

  const visibleContributions = contributions.filter(
    (c) => c.status === currentTab,
  );

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Verify Contributions
      </h1>

      {/* --- Navigation Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {["Pending", "Approved", "Rejected"].map((status) => (
          <div
            key={status}
            onClick={() => setCurrentTab(status)}
            className={`p-4 rounded-xl shadow-sm cursor-pointer transition-all border-2 
              ${
                currentTab === status
                  ? "border-blue-500 bg-white ring-2 ring-blue-100"
                  : "border-transparent bg-white hover:bg-gray-50"
              }`}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-md font-semibold text-gray-600">{status}</h2>
              <span
                className={`text-2xl font-bold ${
                  status === "Pending"
                    ? "text-yellow-500"
                    : status === "Approved"
                      ? "text-green-500"
                      : "text-red-500"
                }`}
              >
                {counts[status]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* --- Content Area --- */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleContributions.length === 0 ? (
            <p className="text-gray-500 italic col-span-full text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              No {currentTab.toLowerCase()} contributions found.
            </p>
          ) : (
            visibleContributions.map((item) => (
              <ContributionCard
                key={item._id}
                data={item}
                onUpdateStatus={updateStatus}
                onClick={() => setSelectedPlace(item)}
              />
            ))
          )}
        </div>
      )}

      {/* --- Modal --- */}
      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
};

const ContributionCard = ({ data, onUpdateStatus, onClick }) => {
  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return "bg-green-50 text-green-700 border-green-200";
    if (rating >= 2.5) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col text-sm cursor-pointer group"
    >
      {/* Image */}
      <div className="h-40 bg-gray-200 overflow-hidden relative">
        {data.images?.[0] ? (
          <img
            src={data.images[0]}
            alt={data.placeName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-gray-900 truncate">
              {data.placeName}
            </h3>
            <p className="text-xs text-gray-500 flex items-center">
              <MapPin size={12} className="mr-1" />
              {data.location}
            </p>
          </div>

          <div
            className={`flex items-center px-2 py-0.5 rounded border text-xs font-bold ${getRatingColor(
              data.rating,
            )}`}
          >
            <Star size={12} className="mr-1 fill-current" />
            {data.rating}
          </div>
        </div>

        <p className="text-xs text-gray-600 italic mb-4 line-clamp-2">
          "{data.description}"
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {data.status === "Pending" && (
            <>
              <ActionButton
                text="Approve"
                icon={<Check size={14} />}
                color="bg-green-600 hover:bg-green-700"
                onClick={(e) =>
                  handleAction(e, () => onUpdateStatus(data._id, "Approved"))
                }
              />
              <ActionButton
                text="Reject"
                icon={<X size={14} />}
                color="bg-red-600 hover:bg-red-700"
                onClick={(e) =>
                  handleAction(e, () => onUpdateStatus(data._id, "Rejected"))
                }
              />
            </>
          )}

          {data.status !== "Pending" && (
            <ActionButton
              text="Undo"
              icon={<RotateCcw size={14} />}
              color="bg-gray-500 hover:bg-gray-600"
              onClick={(e) =>
                handleAction(e, () => onUpdateStatus(data._id, "Pending"))
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, color, icon, text }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-white text-xs font-semibold transition ${color}`}
  >
    {icon} {text}
  </button>
);

export default VerifyContributions;
