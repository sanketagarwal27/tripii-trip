import React, { useEffect } from "react";
import {
  X,
  MapPin,
  Star,
  Calendar,
  Clock,
  DollarSign,
  Utensils,
  Tag,
  Camera,
  Phone,
  User,
  Bed,
  Leaf,
  Sparkles,
  Wallet,
  Info,
  UserCircle,
  History,
} from "lucide-react";

const PlaceDetailsModal = ({ place, onClose }) => {
  if (!place) return null;

  console.log(place);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const getRatingTheme = (rating) => {
    if (rating >= 4.0)
      return {
        container: "bg-green-50 border-green-200",
        star: "text-green-500 fill-green-500",
        text: "text-green-900",
      };
    if (rating >= 2.5)
      return {
        container: "bg-yellow-50 border-yellow-200",
        star: "text-yellow-500 fill-yellow-500",
        text: "text-yellow-900",
      };
    return {
      container: "bg-red-50 border-red-200",
      star: "text-red-500 fill-red-500",
      text: "text-red-900",
    };
  };

  const ratingTheme = getRatingTheme(place.rating);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* --- 1. HEADER IMAGE & STATUS --- */}
        <div className="relative h-64 sm:h-72 bg-gray-200 shrink-0 group">
          {place.images && place.images[0] ? (
            <img
              src={place.images[0]}
              alt={place.placeName}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col gap-2 bg-gray-100">
              <Camera size={48} className="opacity-50" />
              <span className="font-medium">No Image Available</span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-105 z-10"
          >
            <X size={20} className="text-gray-800" />
          </button>

          {/* Badges Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent pt-16 flex items-end gap-3">
            <span className="px-3 py-1 bg-white/95 backdrop-blur rounded-lg text-xs font-bold text-gray-800 shadow-sm uppercase tracking-wide">
              {place.type}
            </span>
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm border ${getStatusColor(
                place.status
              )}`}
            >
              {place.status}
            </span>
          </div>
        </div>

        {/* --- 2. SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 sm:p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start border-b border-gray-100 pb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 break-words leading-tight">
                  {place.placeName}
                </h2>
                <div className="flex items-start text-gray-500 text-sm">
                  <MapPin
                    size={18}
                    className="mr-2 mt-0.5 shrink-0 text-blue-500"
                  />
                  <span className="leading-relaxed">
                    {place.address
                      ? `${place.address}, ${place.location}`
                      : place.location}
                  </span>
                </div>
              </div>

              {/* Rating Box */}
              <div
                className={`flex flex-col items-center justify-center px-6 py-3 rounded-2xl border min-w-[100px] shrink-0 ${ratingTheme.container}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-3xl font-bold ${ratingTheme.text}`}>
                    {place.rating}
                  </span>
                  <Star className={`w-5 h-5 ${ratingTheme.star}`} />
                </div>
                <span
                  className={`text-xs font-medium uppercase tracking-wider opacity-70 ${ratingTheme.text}`}
                >
                  / 5 Score
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN (2/3 width) - Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description - Optimized for Long Text */}
                <section>
                  <h3 className="section-title flex items-center gap-2">
                    <Info size={16} /> About this place
                  </h3>
                  <div className="prose prose-sm sm:prose-base text-gray-600 max-w-none whitespace-pre-line leading-relaxed text-justify">
                    {place.description || "No description provided."}
                  </div>
                </section>

                {/* === DYNAMIC CONTENT: ACCOMMODATION === */}
                {place.type === "Accommodation" && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <SubRating
                        label="Rooms"
                        value={place.roomsRating}
                        icon={<Bed size={16} />}
                      />
                      <SubRating
                        label="Hospitality"
                        value={place.hospitalityRating}
                        icon={<User size={16} />}
                      />
                      <DetailBox
                        icon={<Star size={16} />}
                        label="Class"
                        value={
                          place.hotelStars ? `${place.hotelStars} Star` : "N/A"
                        }
                      />
                      {place.hostelVibe && (
                        <DetailBox
                          icon={<Sparkles size={16} />}
                          label="Vibe"
                          value={place.hostelVibe}
                        />
                      )}
                    </div>

                    {place.amenities?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-3">
                          Amenities
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {place.amenities.map((item, i) => (
                            <Badge key={i} text={item} color="blue" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* === DYNAMIC CONTENT: FOOD & DINING === */}
                {place.type === "Food & Dining" && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-3 gap-3">
                      <SubRating
                        label="Food"
                        value={place.foodRating}
                        icon={<Utensils size={16} />}
                      />
                      <SubRating
                        label="Ambience"
                        value={place.ambienceRating}
                        icon={<Sparkles size={16} />}
                      />
                      <SubRating
                        label="Service"
                        value={place.serviceRating}
                        icon={<User size={16} />}
                      />
                    </div>

                    {/* Long Text Handler for Must Try */}
                    <DetailBox
                      icon={<Utensils size={16} />}
                      label="Must Try Dishes"
                      value={place.mustTry}
                      fullWidth
                      isLongText
                    />

                    <div className="space-y-4">
                      {place.cuisine?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-2">
                            Cuisine
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {place.cuisine.map((item, i) => (
                              <Badge key={i} text={item} color="orange" />
                            ))}
                          </div>
                        </div>
                      )}
                      {place.dietary?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-2">
                            Dietary Options
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {place.dietary.map((item, i) => (
                              <Badge
                                key={i}
                                text={item}
                                color="green"
                                icon={<Leaf size={10} />}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* === DYNAMIC CONTENT: TOURIST SPOT === */}
                {place.type === "Tourist Spot" && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DetailBox
                        icon={<Clock size={16} />}
                        label="Suggested Duration"
                        value={place.timeSpent}
                      />
                      <DetailBox
                        icon={<Wallet size={16} />}
                        label="Entry Cost"
                        value={
                          place.isFree
                            ? "Free Entry"
                            : `${place.entryCost} (Local Currency)`
                        }
                      />
                    </div>
                    {/* If there are travel tips or specific instructions, they would go here */}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN (1/3 width) - Meta & Contact */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 sticky top-0">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                    Details & Contact
                  </h3>

                  <div className="space-y-4">
                    {/* Group 1: Visit Details */}
                    <MetaRow
                      icon={<Calendar size={16} />}
                      label="Visited On"
                      value={formatDate(place.dateOfVisit)}
                    />
                    <MetaRow
                      icon={<Tag size={16} />}
                      label="Category"
                      value={place.category}
                    />

                    {place.type === "Food & Dining" && (
                      <MetaRow
                        icon={<DollarSign size={16} />}
                        label="Price"
                        value={
                          place.priceRange === "1"
                            ? "Budget ($)"
                            : place.priceRange === "2"
                            ? "Moderate ($$)"
                            : "Expensive ($$$)"
                        }
                      />
                    )}

                    {/* Divider */}
                    <div className="h-px bg-gray-200 my-2" />

                    {/* Group 2: Contact Info */}
                    <MetaRow
                      icon={<User size={16} />}
                      label="Contact Person"
                      value={place.contactPerson}
                    />
                    <MetaRow
                      icon={<Phone size={16} />}
                      label="Phone"
                      value={place.contactNumber}
                    />

                    {/* Divider */}
                    <div className="h-px bg-gray-200 my-2" />

                    {/* Group 3: Contribution Info (NEW) */}
                    <MetaRow
                      icon={<UserCircle size={16} />}
                      label="Contributed By"
                      /* logic: try username first, then fallback to userId */
                      value={place.userId.username || "Anonymous"}
                    />
                    <MetaRow
                      icon={<History size={16} />}
                      label="Added On"
                      value={new Date(place.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const MetaRow = ({ icon, label, value }) => (
  <div className="flex items-start text-sm group">
    <span className="text-gray-400 mr-3 mt-0.5 group-hover:text-blue-500 transition-colors">
      {icon}
    </span>
    <div className="flex-1">
      <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
      <p className="text-gray-900 font-medium break-words leading-snug">
        {value || "-"}
      </p>
    </div>
  </div>
);

const DetailBox = ({ icon, label, value, fullWidth, isLongText }) => (
  <div
    className={`flex items-start p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors ${
      fullWidth ? "col-span-full" : ""
    }`}
  >
    <div className="text-gray-400 mr-3 mt-1 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-gray-900 font-medium text-sm leading-relaxed ${
          isLongText ? "whitespace-pre-wrap break-words" : "truncate"
        }`}
      >
        {value || "N/A"}
      </p>
    </div>
  </div>
);

const SubRating = ({ label, value, icon }) => (
  <div className="flex flex-col items-center justify-center p-3 bg-yellow-50/30 border border-yellow-100 rounded-xl text-center">
    <div className="text-yellow-600 mb-1 opacity-80">{icon}</div>
    <span className="text-[10px] uppercase font-bold text-yellow-800/70 mb-1">
      {label}
    </span>
    <span className="text-lg font-bold text-gray-900 leading-none">
      {value}
    </span>
  </div>
);

const Badge = ({ text, color, icon }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    orange:
      "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    green:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  };
  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-default ${
        colors[color] || colors.blue
      }`}
    >
      {icon} {text}
    </span>
  );
};

const styles = `
  .section-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #f3f4f6;
    margin-bottom: 1.25rem;
  }
  
  /* Helper for nice scrolling inside modal */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 20px;
  }
`;

export default PlaceDetailsModal;
