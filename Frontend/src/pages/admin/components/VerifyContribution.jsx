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

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllContributions();
      setContributions(data.data);
    };
    fetchData();
  }, []);

  const updateStatus = async (id, newStatus) => {
    setContributions((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, status: newStatus } : item
      )
    );
    if (newStatus === "Approved") {
      await approveContribution(id);
    } else if (newStatus === "Rejected") {
      await rejectContribution(id);
    } else if (newStatus === "Pending") {
      await setContributionToPending(id);
    }
  };

  const counts = {
    Pending: contributions.filter((c) => c.status === "Pending").length,
    Approved: contributions.filter((c) => c.status === "Approved").length,
    Rejected: contributions.filter((c) => c.status === "Rejected").length,
  };

  const visibleContributions = contributions.filter(
    (c) => c.status === currentTab
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
              }
            `}
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

      {/* --- Contribution Cards Grid --- */}
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
    if (rating >= 4.0) return "bg-green-50 text-green-700 border-green-200";
    if (rating >= 2.5) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const ratingColorClass = getRatingColor(data.rating);

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col text-sm cursor-pointer group"
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="h-40 w-full relative bg-gray-200 overflow-hidden">
        {data.images && data.images[0] ? (
          <img
            src={data.images[0]}
            alt={data.placeName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-semibold text-gray-700 shadow-sm">
          {data.type}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0 pr-2">
            <h3
              className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors"
              title={data.placeName}
            >
              {data.placeName}
            </h3>
            <div className="flex items-center text-gray-500 text-xs mt-0.5 truncate">
              <MapPin size={12} className="mr-1 flex-shrink-0" />
              {data.address}, {data.location}
            </div>
          </div>

          {/* --- RATING BADGE --- */}
          <div
            className={`flex items-center px-1.5 py-0.5 rounded font-bold text-xs flex-shrink-0 border ${ratingColorClass}`}
          >
            <Star size={12} className="fill-current mr-1" />
            {data.rating}
          </div>
        </div>

        <p className="text-gray-600 italic mb-4 line-clamp-2 text-xs bg-gray-50 p-2 rounded border border-gray-100">
          "{data.description}"
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
          {data.status === "Pending" && (
            <>
              <ActionButton
                onClick={(e) =>
                  handleAction(e, () => onUpdateStatus(data._id, "Approved"))
                }
                color="bg-green-600 hover:bg-green-700"
                icon={<Check size={14} />}
                text="Approve"
              />
              <ActionButton
                onClick={(e) =>
                  handleAction(e, () => onUpdateStatus(data._id, "Rejected"))
                }
                color="bg-red-600 hover:bg-red-700"
                icon={<X size={14} />}
                text="Reject"
              />
            </>
          )}

          {data.status === "Approved" && (
            <>
              <ActionButton
                onClick={(e) =>
                  handleAction(e, () => onUpdateStatus(data._id, "Pending"))
                }
                color="bg-gray-500 hover:bg-gray-600"
                icon={<RotateCcw size={14} />}
                text="Undo"
              />
              <ActionButton
                onClick={(e) =>
                  handleAction(e, () => onUpdateStatus(data._id, "Rejected"))
                }
                color="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                icon={<X size={14} />}
                text="Reject"
                light
              />
            </>
          )}

          {data.status === "Rejected" && (
            <>
              <ActionButton
                onClick={(e) =>
                  handleAction(e, () => onUpdateStatus(data._id, "Pending"))
                }
                color="bg-gray-500 hover:bg-gray-600"
                icon={<RotateCcw size={14} />}
                text="Undo"
              />
              <ActionButton
                onClick={(e) =>
                  handleAction(e, () => onUpdateStatus(data._id, "Approved"))
                }
                color="bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                icon={<Check size={14} />}
                text="Approve"
                light
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, color, icon, text, light }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors font-semibold text-xs
      ${light ? color : `text-white ${color}`}
      shadow-sm active:scale-95
    `}
  >
    {icon} {text}
  </button>
);

export default VerifyContributions;
