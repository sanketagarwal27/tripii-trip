import React from "react";

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

const AmenitiesSelector = ({ listingFor, selectedAmenities, onChange }) => {
  const availableAmenities = AMENITIES_BY_TYPE[listingFor] || [];

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      onChange(selectedAmenities.filter((a) => a !== amenity));
    } else {
      onChange([...selectedAmenities, amenity]);
    }
  };

  const selectAll = () => {
    onChange(availableAmenities);
  };

  const clearAll = () => {
    onChange([]);
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
            onClick={selectAll}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={clearAll}
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

export default AmenitiesSelector;
