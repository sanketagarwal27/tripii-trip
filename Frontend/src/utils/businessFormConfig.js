// constants/businessFormConfig.js

/**
 * ================================
 * AMENITIES BY BUSINESS TYPE
 * ================================
 */
export const AMENITIES_BY_TYPE = {
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

/**
 * ================================
 * BASIC vs ADVANCED FIELDS
 * ================================
 */

// Fields required for ALL business types (Step 1)
export const COMMON_BASIC_FIELDS = {
  identity: ["businessName"],
  owner: [
    "owner.fullName",
    "owner.phone",
    "owner.email",
    "owner.governmentId.idType",
    "owner.governmentId.idNumber",
  ],
  address: [
    "address.fullAddress",
    "address.city",
    "address.state",
    "address.pincode",
    "address.geoLocation",
  ],
  banking: [
    "bankDetails.accountHolderName",
    "bankDetails.accountNumber",
    "bankDetails.ifscCode",
    "bankDetails.cancelledChequeUrl",
  ],
  media: ["media.coverImage", "media.exteriorPhotos"],
  compliance: ["termsAccepted"],
};

// Fields required for ALL business types (Step 2/Advanced)
export const COMMON_ADVANCED_FIELDS = {
  legal: [
    "legalDocuments.panCardNumber",
    "propertyAuthorization.ownershipProofUrl",
  ],
  media: ["media.interiorPhotos"],
  onlinePresence: ["onlinePresence.googleBusinessUrl"],
  operations: ["operations.openingTime", "operations.closingTime"],
};

// Category-specific BASIC fields (must fill to submit)
export const CATEGORY_BASIC_FIELDS = {
  Hotel: {
    operations: [
      "operations.numberOfRooms",
      "operations.priceRange.min",
      "operations.priceRange.max",
    ],
    media: ["media.roomsOrDiningPhotos"],
    legal: ["legalDocuments.fireSafetyCertificateUrl"],
  },
  Hostel: {
    operations: [
      "operations.numberOfRooms",
      "operations.numberOfBeds",
      "operations.priceRange.min",
      "operations.priceRange.max",
    ],
    media: ["media.roomsOrDiningPhotos"],
    legal: ["legalDocuments.fireSafetyCertificateUrl"],
  },
  Resort: {
    operations: [
      "operations.numberOfRooms",
      "operations.priceRange.min",
      "operations.priceRange.max",
    ],
    media: ["media.roomsOrDiningPhotos"],
    legal: ["legalDocuments.fireSafetyCertificateUrl"],
  },
  Homestay: {
    operations: [
      "operations.numberOfRooms",
      "operations.numberOfBeds",
      "operations.priceRange.min",
      "operations.priceRange.max",
    ],
    media: ["media.roomsOrDiningPhotos"],
  },
  Restaurant: {
    operations: ["operations.seatingCapacity"],
    media: ["media.kitchenPhotos"],
    legal: ["legalDocuments.fssaiNumber"],
  },
  Cafe: {
    operations: ["operations.seatingCapacity"],
    media: ["media.kitchenPhotos"],
    legal: ["legalDocuments.fssaiNumber"],
  },
  "Travel Package Agency": {
    serviceDetails: [
      "serviceDetails.licenseNumber",
      "serviceDetails.operatingRegions",
      "serviceDetails.yearsOfExperience",
    ],
  },
  "Adventure Activity Provider": {
    serviceDetails: [
      "serviceDetails.activityTypes",
      "serviceDetails.maxGroupSize",
    ],
    legal: ["legalDocuments.insurancePolicyUrl"],
  },
};

// Category-specific ADVANCED fields (to go live)
export const CATEGORY_ADVANCED_FIELDS = {
  Hotel: {
    legal: ["legalDocuments.insurancePolicyUrl"],
    media: ["media.videoWalkthroughUrl"],
    operations: ["operations.cancellationPolicy"],
  },
  Hostel: {
    legal: ["legalDocuments.insurancePolicyUrl"],
    media: ["media.videoWalkthroughUrl"],
    operations: ["operations.cancellationPolicy"],
  },
  Resort: {
    legal: [
      "legalDocuments.insurancePolicyUrl",
      "legalDocuments.businessRegistrationUrl",
    ],
    media: ["media.videoWalkthroughUrl"],
    operations: ["operations.cancellationPolicy"],
  },
  Homestay: {
    media: ["media.videoWalkthroughUrl"],
    operations: ["operations.cancellationPolicy"],
  },
  Restaurant: {
    legal: [
      "legalDocuments.fssaiCertificateUrl",
      "legalDocuments.tradeLicenseUrl",
    ],
    operations: ["operations.priceRange"],
    media: ["media.videoWalkthroughUrl"],
  },
  Cafe: {
    legal: ["legalDocuments.fssaiCertificateUrl"],
    operations: ["operations.priceRange"],
    media: ["media.videoWalkthroughUrl"],
  },
  "Travel Package Agency": {
    serviceDetails: [
      "serviceDetails.emergencySupportAvailable",
      "serviceDetails.insuranceProvided",
    ],
    legal: ["legalDocuments.tradeLicenseUrl"],
  },
  "Adventure Activity Provider": {
    serviceDetails: [
      "serviceDetails.safetyGuidelinesUrl",
      "serviceDetails.emergencySupportAvailable",
    ],
    media: ["media.videoWalkthroughUrl"],
  },
};

/**
 * ================================
 * HELPER FUNCTIONS
 * ================================
 */

// Get amenities for a specific business type
export const getAmenitiesForType = (businessType) => {
  return AMENITIES_BY_TYPE[businessType] || [];
};

// Check if all basic fields are filled
export const isBasicComplete = (formData, businessType) => {
  const commonFields = Object.values(COMMON_BASIC_FIELDS).flat();
  const categoryFields = CATEGORY_BASIC_FIELDS[businessType]
    ? Object.values(CATEGORY_BASIC_FIELDS[businessType]).flat()
    : [];

  const allRequiredFields = [...commonFields, ...categoryFields];

  return allRequiredFields.every((field) => {
    const value = getNestedValue(formData, field);
    return value !== null && value !== undefined && value !== "";
  });
};

// Check if all advanced fields are filled
export const isAdvancedComplete = (formData, businessType) => {
  const commonFields = Object.values(COMMON_ADVANCED_FIELDS).flat();
  const categoryFields = CATEGORY_ADVANCED_FIELDS[businessType]
    ? Object.values(CATEGORY_ADVANCED_FIELDS[businessType]).flat()
    : [];

  const allRequiredFields = [...commonFields, ...categoryFields];

  return allRequiredFields.every((field) => {
    const value = getNestedValue(formData, field);
    return value !== null && value !== undefined && value !== "";
  });
};

// Helper to get nested object value
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

// Get category-specific fields for display
export const getCategoryFields = (businessType, step = "basic") => {
  const fieldsMap =
    step === "basic" ? CATEGORY_BASIC_FIELDS : CATEGORY_ADVANCED_FIELDS;
  return fieldsMap[businessType] || {};
};
