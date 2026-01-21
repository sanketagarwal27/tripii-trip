import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  Home,
  Building2,
  UtensilsCrossed,
  Coffee,
  Plane,
  Mountain,
  MapPin,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  FileText,
  Camera,
} from "lucide-react";
import { sub } from "date-fns";
import { submitBusinessListing } from "@/api/marketPlace";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

const FixMapResize = () => {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);

  return null;
};

const MapAutoZoom = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position?.lat && position?.lng) {
      map.flyTo([position.lat, position.lng], 15, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [position, map]);

  return null;
};

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const AMENITIES_BY_TYPE = {
  Hotel: [
    "24x7 Front Desk",
    "Luxury Rooms & Suites",
    "Daily Housekeeping",
    "Concierge Service",
    "Multi-Cuisine Restaurant",
    "In-Room Dining",
    "Swimming Pool",
    "Spa & Wellness Center",
    "Fitness Center / Gym",
    "Business Center",
    "Conference & Banquet Hall",
    "High-Speed WiFi",
    "Airport Transfers",
    "Valet Parking",
    "Bar / Lounge",
    "Laundry & Dry Cleaning",
    "Smart Room Controls",
    "Wheelchair Accessibility",
    "CCTV & Security Staff",
  ],
  Hostel: [
    "Premium Shared & Private Rooms",
    "24x7 Reception",
    "High-Speed WiFi",
    "Community Lounge",
    "Co-working Space",
    "Café / Common Kitchen",
    "Laundry Facilities",
    "Secure Lockers",
    "Daily Housekeeping",
    "Power Backup",
    "Social Events & Tours",
    "Female-Only Dorms",
    "CCTV Security",
    "Travel Desk",
  ],
  Resort: [
    "Private Villas / Luxury Rooms",
    "Swimming Pool (Infinity / Private)",
    "Landscaped Gardens",
    "BBQ Area",
    "Private Beach / Lake Access",
    "Spa & Ayurvedic Center",
    "Adventure Activities",
    "Indoor & Outdoor Games",
    "Kids Play Area",
    "Fine Dining Restaurant",
    "Bar / Poolside Bar",
    "Helipad",
    "Yoga & Meditation Space",
    "Nature Trails",
    "Event / Wedding Lawn",
    "24x7 Room Service",
    "Concierge",
    "High-End Security",
  ],
  Homestay: [
    "Private Bedrooms",
    "Attached Bathrooms",
    "Home-Cooked Meals",
    "High-Speed WiFi",
    "Air Conditioning / Heating",
    "Daily Cleaning",
    "Local Experience Hosting",
    "Scenic Views",
    "Garden / Sit-out Area",
    "Bonfire Setup",
    "Parking Space",
    "Laundry Support",
    "Pet Friendly",
    "Power Backup",
    "Local Guide Assistance",
  ],
  Restaurant: [
    "Fine Dining Setup",
    "Multi-Cuisine Menu",
    "Premium Interior Design",
    "Professional Chefs",
    "Hygienic Open Kitchen",
    "Indoor & Outdoor Seating",
    "Private Dining Rooms",
    "Bar / Alcohol Service",
    "Valet Parking",
    "Reservation System",
    "Live Music / Entertainment",
    "Air Conditioning",
    "Wheelchair Accessibility",
    "High Hygiene Rating",
    "CCTV & Security",
  ],
  Cafe: [
    "Specialty Coffee & Beverages",
    "Signature Desserts",
    "Aesthetic Interiors",
    "High-Speed WiFi",
    "Work-Friendly Seating",
    "Outdoor Seating",
    "Power Sockets",
    "Pet Friendly",
    "Live Music / Open Mic",
    "Air Conditioning",
    "Contactless Payments",
    "Hygienic Kitchen",
    "Instagrammable Ambience",
  ],
  "Travel Package Agency": [
    "Customized Travel Packages",
    "Domestic & International Tours",
    "Hotel & Transport Tie-Ups",
    "Experienced Tour Managers",
    "24x7 Customer Support",
    "Visa Assistance",
    "Travel Insurance Support",
    "Emergency Handling",
    "Luxury & Budget Packages",
    "Group & Solo Trips",
    "Digital Itinerary",
    "Local Guide Network",
    "Transparent Pricing",
  ],
  "Adventure Activity Provider": [
    "Certified Instructors",
    "International Safety Standards",
    "Safety Gear Provided",
    "First Aid & Medical Support",
    "Insurance Coverage",
    "Government Permissions",
    "High-Quality Equipment",
    "Professional Briefing",
    "Photography / Videography",
    "Changing Rooms",
    "Lockers",
    "Refreshments",
    "Emergency Evacuation Plan",
  ],
};

// ============= SHARED COMPONENTS =============
const FileUpload = ({ label, accept, multiple, onChange, required, files }) => (
  <div className="space-y-2">
    <label className="block text-base font-medium text-gray-900">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 bg-gray-50 hover:bg-gray-100 transition">
      <Upload className="w-8 h-8 text-gray-400" />
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onChange(Array.from(e.target.files))}
        className="hidden"
        id={`file-${label.replace(/\s+/g, "-")}`}
      />
      <label
        htmlFor={`file-${label.replace(/\s+/g, "-")}`}
        className="px-4 py-2 bg-[#3be3d2] text-gray-900 rounded-lg cursor-pointer hover:opacity-80 font-semibold"
      >
        Choose Files
      </label>
      {files && files.length > 0 && (
        <div className="text-sm text-gray-600">
          {files.length} file(s) selected
        </div>
      )}
    </div>
  </div>
);

const LocationPicker = ({ position, setPosition, onAddressUpdate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
        setPosition(newPos);
        reverseGeocode(newPos.lat, newPos.lng);
      },
    });
    return null;
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data?.address) {
        onAddressUpdate({
          fullAddress: data.display_name,
          city:
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "",
          state: data.address.state || "",
          pincode: data.address.postcode || "",
        });
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(newPos);
          reverseGeocode(newPos.lat, newPos.lng);
        },
        (error) => alert("Unable to get location: " + error.message)
      );
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await response.json();
      if (data?.length > 0) {
        const newPos = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setPosition(newPos);
        reverseGeocode(newPos.lat, newPos.lng);
      } else {
        alert("Location not found");
      }
    } catch (error) {
      alert("Search error: " + error.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && searchLocation()}
          placeholder="Search location..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
        />
        <button
          onClick={searchLocation}
          disabled={searching}
          className="px-4 py-2 bg-[#3be3d2] text-gray-900 rounded-lg hover:opacity-80 font-semibold whitespace-nowrap disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
        <button
          onClick={getCurrentLocation}
          className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
          title="Use my location"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>
      <div className="h-96 rounded-lg overflow-hidden border-2 border-gray-300">
        <MapContainer
          center={[20.5937, 78.9629]} // default India view
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <FixMapResize />
          <MapAutoZoom position={position} />

          {position.lat && position.lng && (
            <Marker position={[position.lat, position.lng]} />
          )}

          <MapClickHandler />
        </MapContainer>
      </div>
      <p className="text-sm text-gray-600">
        Click on the map to pin your location
      </p>
    </div>
  );
};

const CategorySpecificFields = ({ listingFor, formData, updateFormData }) => {
  const renderAccommodationFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-base font-medium text-gray-900 mb-2">
          Number of Rooms <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.operations?.numberOfRooms || ""}
          onChange={(e) =>
            updateFormData("operations", "numberOfRooms", e.target.value)
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
          placeholder="Enter number of rooms"
          required
        />
      </div>
      {listingFor === "Hostel" && (
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Number of Beds <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.operations?.numberOfBeds || ""}
            onChange={(e) =>
              updateFormData("operations", "numberOfBeds", e.target.value)
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
            placeholder="Total bed capacity"
            required
          />
        </div>
      )}
      <div>
        <label className="block text-base font-medium text-gray-900 mb-2">
          Min Price per Night (₹) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.operations?.priceRange?.min || ""}
          onChange={(e) =>
            updateFormData("operations", "priceRange", {
              ...formData.operations?.priceRange,
              min: e.target.value,
            })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
          placeholder="500"
          required
        />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-900 mb-2">
          Max Price per Night (₹) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.operations?.priceRange?.max || ""}
          onChange={(e) =>
            updateFormData("operations", "priceRange", {
              ...formData.operations?.priceRange,
              max: e.target.value,
            })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
          placeholder="5000"
          required
        />
      </div>
    </div>
  );

  const renderFoodBusinessFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-base font-medium text-gray-900 mb-2">
          Seating Capacity <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.operations?.seatingCapacity || ""}
          onChange={(e) =>
            updateFormData("operations", "seatingCapacity", e.target.value)
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
          placeholder="50"
          required
        />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-900 mb-2">
          FSSAI Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.legalDocuments?.fssaiNumber || ""}
          onChange={(e) =>
            updateFormData(
              "legalDocuments",
              "fssaiNumber",
              e.target.value.toUpperCase()
            )
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
          placeholder="12345678901234"
          required
        />
      </div>
    </div>
  );

  const renderAgencyFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-base font-medium text-gray-900 mb-2">
          License Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.serviceDetails?.licenseNumber || ""}
          onChange={(e) =>
            updateFormData("serviceDetails", "licenseNumber", e.target.value)
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
          placeholder="License number"
          required
        />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-900 mb-2">
          Years of Experience <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.serviceDetails?.yearsOfExperience || ""}
          onChange={(e) =>
            updateFormData(
              "serviceDetails",
              "yearsOfExperience",
              e.target.value
            )
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
          placeholder="5"
          required
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-base font-medium text-gray-900 mb-2">
          Operating Regions <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.serviceDetails?.operatingRegions?.join(", ") || ""}
          onChange={(e) =>
            updateFormData(
              "serviceDetails",
              "operatingRegions",
              e.target.value.split(",").map((r) => r.trim())
            )
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
          placeholder="Delhi, Mumbai, Goa (comma separated)"
          required
        />
      </div>
    </div>
  );

  const renderAdventureFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-base font-medium text-gray-900 mb-2">
          Activity Types <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.serviceDetails?.activityTypes?.join(", ") || ""}
          onChange={(e) =>
            updateFormData(
              "serviceDetails",
              "activityTypes",
              e.target.value.split(",").map((a) => a.trim())
            )
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
          placeholder="Paragliding, Rafting, Trekking"
          required
        />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-900 mb-2">
          Max Group Size <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.serviceDetails?.maxGroupSize || ""}
          onChange={(e) =>
            updateFormData("serviceDetails", "maxGroupSize", e.target.value)
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
          placeholder="15"
          required
        />
      </div>
    </div>
  );

  if (["Hotel", "Hostel", "Resort", "Homestay"].includes(listingFor)) {
    return renderAccommodationFields();
  } else if (["Restaurant", "Cafe"].includes(listingFor)) {
    return renderFoodBusinessFields();
  } else if (listingFor === "Travel Package Agency") {
    return renderAgencyFields();
  } else if (listingFor === "Adventure Activity Provider") {
    return renderAdventureFields();
  }
  return null;
};

const AmenitiesSelector = ({ listingFor, selectedAmenities, onChange }) => {
  const availableAmenities = AMENITIES_BY_TYPE[listingFor] || [];

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      onChange(selectedAmenities.filter((a) => a !== amenity));
    } else {
      onChange([...selectedAmenities, amenity]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">
          Amenities & Features
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(availableAmenities)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Clear All
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {availableAmenities.map((amenity) => (
          <label
            key={amenity}
            className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition ${
              selectedAmenities.includes(amenity)
                ? "border-[#3be3d2] bg-[#3be3d2]/10"
                : "border-gray-300 hover:border-[#3be3d2]/50"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedAmenities.includes(amenity)}
              onChange={() => toggleAmenity(amenity)}
              className="w-5 h-5 text-[#3be3d2] border-gray-300 rounded focus:ring-[#3be3d2]"
            />
            <span className="text-sm font-medium text-gray-900">{amenity}</span>
          </label>
        ))}
      </div>
      <p className="text-sm text-gray-600">
        {selectedAmenities.length} of {availableAmenities.length} selected
      </p>
    </div>
  );
};

// ============= MAIN FORM =============
const BusinessListingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [listingFor] = useState(
    () =>
      location.state?.listingFor ||
      new URLSearchParams(window.location.search).get("type")
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState({ lat: null, lng: null });

  const [formData, setFormData] = useState({
    businessName: "",
    owner: {
      fullName: "",
      phone: "",
      email: "",
      role: "owner",
      governmentId: { idType: "pan", idNumber: "", idDocumentUrl: null },
    },
    address: {
      fullAddress: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      landmark: "",
      geoLocation: { lat: null, lng: null },
    },
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      cancelledChequeUrl: null,
    },
    media: {
      coverImage: null,
      exteriorPhotos: [],
      interiorPhotos: [],
      roomsOrDiningPhotos: [],
      kitchenPhotos: [],
    },
    onlinePresence: {
      googleBusinessUrl: "",
      websiteUrl: "",
      instagramUrl: "",
    },
    operations: {
      openingTime: "",
      closingTime: "",
      numberOfRooms: "",
      numberOfBeds: "",
      seatingCapacity: "",
      priceRange: { min: "", max: "" },
      amenities: [],
    },
    legalDocuments: {
      panCardNumber: "",
      fssaiNumber: "",
      fireSafetyCertificateUrl: null,
      fssaiCertificateUrl: null,
      insurancePolicyUrl: null,
      tradeLicenseUrl: null,
    },
    propertyAuthorization: {
      ownershipProofUrl: null,
    },
    serviceDetails: {
      licenseNumber: "",
      operatingRegions: [],
      yearsOfExperience: "",
      activityTypes: [],
      maxGroupSize: "",
    },
    termsAccepted: false,
  });

  if (!listingFor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">
            Business type missing
          </h2>
          <p className="text-gray-600">Please select a business type again.</p>
          <button
            onClick={() => navigate("/marketplace/list-business")}
            className="px-6 py-3 bg-black text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const updateFormData = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleAddressUpdate = (addressData) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, ...addressData },
    }));
  };

  const isStep1Valid = () => {
    return (
      formData.businessName &&
      formData.owner.fullName &&
      formData.owner.phone &&
      formData.owner.email &&
      formData.owner.governmentId.idNumber &&
      formData.address.fullAddress &&
      formData.address.city &&
      formData.address.state &&
      formData.address.pincode &&
      position.lat &&
      position.lng &&
      formData.bankDetails.accountHolderName &&
      formData.bankDetails.accountNumber &&
      formData.bankDetails.ifscCode &&
      formData.bankDetails.cancelledChequeUrl &&
      formData.media.coverImage &&
      formData.media.exteriorPhotos.length >= 2 &&
      formData.onlinePresence.googleBusinessUrl &&
      formData.termsAccepted
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitFormData = new FormData();

      submitFormData.append("listingFor", listingFor);
      submitFormData.append("businessName", formData.businessName);

      // Owner
      submitFormData.append("owner[fullName]", formData.owner.fullName);
      submitFormData.append("owner[phone]", formData.owner.phone);
      submitFormData.append("owner[email]", formData.owner.email);
      submitFormData.append("owner[role]", formData.owner.role);
      submitFormData.append(
        "owner[governmentId][idType]",
        formData.owner.governmentId.idType
      );
      submitFormData.append(
        "owner[governmentId][idNumber]",
        formData.owner.governmentId.idNumber
      );

      // Address
      submitFormData.append(
        "address[fullAddress]",
        formData.address.fullAddress
      );
      submitFormData.append("address[city]", formData.address.city);
      submitFormData.append("address[state]", formData.address.state);
      submitFormData.append("address[country]", formData.address.country);
      submitFormData.append("address[pincode]", formData.address.pincode);
      if (formData.address.landmark) {
        submitFormData.append("address[landmark]", formData.address.landmark);
      }
      submitFormData.append("address[geoLocation][lat]", position.lat);
      submitFormData.append("address[geoLocation][lng]", position.lng);

      // Bank
      submitFormData.append(
        "bankDetails[accountHolderName]",
        formData.bankDetails.accountHolderName
      );
      submitFormData.append(
        "bankDetails[accountNumber]",
        formData.bankDetails.accountNumber
      );
      submitFormData.append(
        "bankDetails[ifscCode]",
        formData.bankDetails.ifscCode
      );

      // Online
      submitFormData.append(
        "onlinePresence[googleBusinessUrl]",
        formData.onlinePresence.googleBusinessUrl
      );
      if (formData.onlinePresence.websiteUrl) {
        submitFormData.append(
          "onlinePresence[websiteUrl]",
          formData.onlinePresence.websiteUrl
        );
      }
      if (formData.onlinePresence.instagramUrl) {
        submitFormData.append(
          "onlinePresence[instagramUrl]",
          formData.onlinePresence.instagramUrl
        );
      }

      // Operations
      if (formData.operations.openingTime) {
        submitFormData.append(
          "operations[openingTime]",
          formData.operations.openingTime
        );
      }
      if (formData.operations.closingTime) {
        submitFormData.append(
          "operations[closingTime]",
          formData.operations.closingTime
        );
      }
      if (formData.operations.numberOfRooms) {
        submitFormData.append(
          "operations[numberOfRooms]",
          formData.operations.numberOfRooms
        );
      }
      if (formData.operations.numberOfBeds) {
        submitFormData.append(
          "operations[numberOfBeds]",
          formData.operations.numberOfBeds
        );
      }
      if (formData.operations.seatingCapacity) {
        submitFormData.append(
          "operations[seatingCapacity]",
          formData.operations.seatingCapacity
        );
      }
      if (formData.operations.priceRange?.min) {
        submitFormData.append(
          "operations[priceRange][min]",
          formData.operations.priceRange.min
        );
      }
      if (formData.operations.priceRange?.max) {
        submitFormData.append(
          "operations[priceRange][max]",
          formData.operations.priceRange.max
        );
      }
      formData.operations.amenities.forEach((amenity, i) => {
        submitFormData.append(`operations[amenities][${i}]`, amenity);
      });

      // Legal
      if (formData.legalDocuments.fssaiNumber) {
        submitFormData.append(
          "legalDocuments[fssaiNumber]",
          formData.legalDocuments.fssaiNumber
        );
      }

      // Service
      if (formData.serviceDetails.licenseNumber) {
        submitFormData.append(
          "serviceDetails[licenseNumber]",
          formData.serviceDetails.licenseNumber
        );
      }
      if (formData.serviceDetails.yearsOfExperience) {
        submitFormData.append(
          "serviceDetails[yearsOfExperience]",
          formData.serviceDetails.yearsOfExperience
        );
      }
      formData.serviceDetails.operatingRegions?.forEach((region, i) => {
        submitFormData.append(`serviceDetails[operatingRegions][${i}]`, region);
      });
      formData.serviceDetails.activityTypes?.forEach((activity, i) => {
        submitFormData.append(`serviceDetails[activityTypes][${i}]`, activity);
      });
      if (formData.serviceDetails.maxGroupSize) {
        submitFormData.append(
          "serviceDetails[maxGroupSize]",
          formData.serviceDetails.maxGroupSize
        );
      }

      submitFormData.append("termsAccepted", formData.termsAccepted);

      // Files
      if (formData.media.coverImage) {
        submitFormData.append("coverImage", formData.media.coverImage[0]);
      }
      formData.media.exteriorPhotos.forEach((file) => {
        submitFormData.append("exteriorPhotos", file);
      });
      formData.media.interiorPhotos.forEach((file) => {
        submitFormData.append("interiorPhotos", file);
      });
      if (formData.bankDetails.cancelledChequeUrl) {
        submitFormData.append(
          "documents",
          formData.bankDetails.cancelledChequeUrl[0]
        );
      }

      const data = await submitBusinessListing(submitFormData);

      if (data.success) {
        alert("Business listing submitted successfully!");
        navigate("/marketplace");
      } else {
        alert(data.message || "Error submitting form");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToStep2 = () => {
    if (isStep1Valid()) {
      setCurrentStep(2);
    } else {
      alert("Please fill all required fields in Step 1");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div
              className={`flex items-center gap-2 ${
                currentStep === 1 ? "text-[#3be3d2]" : "text-green-500"
              }`}
            >
              {currentStep === 1 ? (
                <FileText className="w-6 h-6" />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
              <span className="font-semibold">Basic Information</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300 mx-4">
              <div
                className={`h-full bg-[#3be3d2] transition-all ${
                  currentStep === 2 ? "w-full" : "w-0"
                }`}
              />
            </div>
            <div
              className={`flex items-center gap-2 ${
                currentStep === 2 ? "text-[#3be3d2]" : "text-gray-400"
              }`}
            >
              <Camera className="w-6 h-6" />
              <span className="font-semibold">Additional Details</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            List Your {listingFor}
          </h1>
          <p className="text-gray-600">
            {currentStep === 1
              ? "Fill in the required information to get started"
              : "Add more details about your business"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 space-y-8"
        >
          {currentStep === 1 ? (
            <>
              {/* Business Name */}
              <div>
                <label className="block text-base font-medium text-gray-900 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                  placeholder="Enter business name"
                  required
                />
              </div>

              {/* Owner */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Owner/Manager Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.owner.fullName}
                      onChange={(e) =>
                        updateFormData("owner", "fullName", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.owner.phone}
                      onChange={(e) =>
                        updateFormData("owner", "phone", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.owner.email}
                      onChange={(e) =>
                        updateFormData("owner", "email", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      PAN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.owner.governmentId.idNumber}
                      onChange={(e) => {
                        const updated = {
                          ...formData.owner.governmentId,
                          idNumber: e.target.value.toUpperCase(),
                        };
                        updateFormData("owner", "governmentId", updated);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      placeholder="ABCDE1234F"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Business Location
                </h3>
                <LocationPicker
                  position={position}
                  setPosition={setPosition}
                  onAddressUpdate={handleAddressUpdate}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Full Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address.fullAddress}
                      onChange={(e) =>
                        updateFormData("address", "fullAddress", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) =>
                        updateFormData("address", "city", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) =>
                        updateFormData("address", "state", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address.pincode}
                      onChange={(e) =>
                        updateFormData("address", "pincode", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bank */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Bank Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Account Holder Name{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountHolderName}
                      onChange={(e) =>
                        updateFormData(
                          "bankDetails",
                          "accountHolderName",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) =>
                        updateFormData(
                          "bankDetails",
                          "accountNumber",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.ifscCode}
                      onChange={(e) =>
                        updateFormData(
                          "bankDetails",
                          "ifscCode",
                          e.target.value.toUpperCase()
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      placeholder="SBIN0001234"
                      required
                    />
                  </div>
                  <div>
                    <FileUpload
                      label="Cancelled Cheque"
                      accept="image/*,.pdf"
                      required
                      onChange={(files) =>
                        updateFormData(
                          "bankDetails",
                          "cancelledChequeUrl",
                          files
                        )
                      }
                      files={formData.bankDetails.cancelledChequeUrl}
                    />
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Business Photos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUpload
                    label="Cover Image"
                    accept="image/*"
                    required
                    onChange={(files) =>
                      updateFormData("media", "coverImage", files)
                    }
                    files={formData.media.coverImage}
                  />
                  <FileUpload
                    label="Exterior Photos (Min 2)"
                    accept="image/*"
                    multiple
                    required
                    onChange={(files) =>
                      updateFormData("media", "exteriorPhotos", files)
                    }
                    files={formData.media.exteriorPhotos}
                  />
                </div>
              </div>

              {/* Online */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Online Presence
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Google Business URL{" "}
                      {/* <span className="text-red-500">*</span> */}
                    </label>
                    <input
                      type="url"
                      value={formData.onlinePresence.googleBusinessUrl}
                      onChange={(e) =>
                        updateFormData(
                          "onlinePresence",
                          "googleBusinessUrl",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      placeholder="https://g.page/..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.onlinePresence.websiteUrl}
                      onChange={(e) =>
                        updateFormData(
                          "onlinePresence",
                          "websiteUrl",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={formData.onlinePresence.instagramUrl}
                      onChange={(e) =>
                        updateFormData(
                          "onlinePresence",
                          "instagramUrl",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsAccepted: e.target.checked,
                    })
                  }
                  className="mt-1 w-5 h-5 text-[#3be3d2] border-gray-300 rounded focus:ring-[#3be3d2]"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  <span className="text-red-500">*</span> I accept the terms and
                  conditions and confirm that all information is accurate
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/marketplace/list-business")}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={goToStep2}
                  disabled={!isStep1Valid()}
                  className="px-8 py-3 bg-[#3be3d2] text-gray-900 rounded-lg font-bold hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  Continue to Step 2
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Category Specific */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Business Details
                </h3>
                <CategorySpecificFields
                  listingFor={listingFor}
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </div>

              {/* Operating Hours */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Operating Hours
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={formData.operations.openingTime}
                      onChange={(e) =>
                        updateFormData(
                          "operations",
                          "openingTime",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={formData.operations.closingTime}
                      onChange={(e) =>
                        updateFormData(
                          "operations",
                          "closingTime",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3be3d2]"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <AmenitiesSelector
                listingFor={listingFor}
                selectedAmenities={formData.operations.amenities}
                onChange={(amenities) =>
                  updateFormData("operations", "amenities", amenities)
                }
              />

              {/* Additional Photos */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Additional Photos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUpload
                    label="Interior Photos"
                    accept="image/*"
                    multiple
                    onChange={(files) =>
                      updateFormData("media", "interiorPhotos", files)
                    }
                    files={formData.media.interiorPhotos}
                  />
                  <FileUpload
                    label="Rooms/Dining Photos"
                    accept="image/*"
                    multiple
                    onChange={(files) =>
                      updateFormData("media", "roomsOrDiningPhotos", files)
                    }
                    files={formData.media.roomsOrDiningPhotos}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Step 1
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#3be3d2] text-gray-900 rounded-lg font-bold hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Listing
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default BusinessListingForm;
