import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Building2,
  UtensilsCrossed,
  Coffee,
  Plane,
  Mountain,
  ChevronRight,
} from "lucide-react";

const BUSINESS_TYPES = [
  { id: "Hotel", label: "Hotel", icon: Building2, color: "#3be3d2" },
  { id: "Hostel", label: "Hostel", icon: Home, color: "#ff6b6b" },
  { id: "Resort", label: "Resort", icon: Building2, color: "#4ecdc4" },
  { id: "Homestay", label: "Homestay", icon: Home, color: "#95e1d3" },
  {
    id: "Restaurant",
    label: "Restaurant",
    icon: UtensilsCrossed,
    color: "#f38181",
  },
  { id: "Cafe", label: "Cafe", icon: Coffee, color: "#aa96da" },
  {
    id: "Travel Package Agency",
    label: "Travel Agency",
    icon: Plane,
    color: "#fcbad3",
  },
  {
    id: "Adventure Activity Provider",
    label: "Adventure",
    icon: Mountain,
    color: "#a8d8ea",
  },
];

const BusinessTypeSelection = () => {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;

    navigate("/marketplace/list-business/form", {
      state: { listingFor: selected },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            List Your Business
          </h1>
          <p className="text-lg text-gray-600">
            Choose the category that best describes your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {BUSINESS_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selected === type.id;

            return (
              <button
                key={type.id}
                onClick={() => setSelected(type.id)}
                className={`p-6 rounded-xl border-2 transition-all text-center ${
                  isSelected
                    ? "border-[#3be3d2] bg-[#3be3d2]/10 shadow-lg"
                    : "border-gray-200 bg-white hover:border-[#3be3d2]/50"
                }`}
              >
                <Icon
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: type.color }}
                />
                <h3 className="font-bold text-lg">{type.label}</h3>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="px-10 py-4 bg-[#3be3d2] text-gray-900 rounded-lg font-bold text-lg flex items-center gap-2 hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessTypeSelection;
