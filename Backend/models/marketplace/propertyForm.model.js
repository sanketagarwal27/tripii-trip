import mongoose, { Schema } from "mongoose";

const BusinessListingSchema = new Schema(
  {
    /* =========================
       PLATFORM OWNERSHIP
    ========================== */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* =========================
       WHAT IS BEING LISTED
    ========================== */
    listingFor: {
      type: String,
      required: true,
      enum: [
        "Hotel",
        "Hostel",
        "Resort",
        "Homestay",
        "Restaurant",
        "Cafe",
        "Travel Package Agency",
        "Adventure Activity Provider",
        "Local Guide",
        "Transport Service",
      ],
    },

    /* =========================
       BUSINESS IDENTITY (MANDATORY)
    ========================== */
    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    legalBusinessName: {
      type: String,
    },

    legalEntityType: {
      type: String,
      enum: [
        "individual",
        "proprietorship",
        "partnership",
        "private_limited",
        "llp",
      ],
    },

    yearEstablished: {
      type: Number,
    },

    /* =========================
       OWNER / AUTHORIZED PERSON
    ========================== */
    owner: {
      fullName: { type: String, required: true },
      role: {
        type: String,
        enum: ["owner", "manager", "authorized_signatory"],
        default: "owner",
      },
      phone: { type: String, required: true },
      email: { type: String, required: true },

      governmentId: {
        idType: {
          type: String,
          enum: ["aadhaar", "pan", "passport", "driving_license"],
          required: true,
        },
        idNumber: { type: String, required: true },
        idDocumentUrl: { type: String },
        selfieUrl: { type: String }, // enhanced KYC
      },
    },

    /* =========================
       LOCATION & ADDRESS
    ========================== */
    address: {
      fullAddress: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: "India" },
      pincode: { type: String, required: true },
      landmark: { type: String },

      geoLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },

      addressProofUrl: { type: String },
    },

    /* =========================
       LEGAL & TAX DOCUMENTS
    ========================== */
    legalDocuments: {
      businessRegistrationUrl: { type: String },

      tradeLicenseUrl: { type: String },

      panCardNumber: { type: String },
      panCardUrl: { type: String },

      gstNumber: { type: String },
      gstCertificateUrl: { type: String },

      fssaiNumber: { type: String }, // restaurants
      fssaiCertificateUrl: { type: String },

      fireSafetyCertificateUrl: { type: String }, // hotels/hostels
      insurancePolicyUrl: { type: String }, // activities / transport
    },

    /* =========================
       OWNERSHIP / AUTHORIZATION
    ========================== */
    propertyAuthorization: {
      ownershipProofUrl: { type: String },
      leaseAgreementUrl: { type: String },
      authorizationLetterUrl: { type: String },
    },

    /* =========================
       BANKING & PAYOUTS
    ========================== */
    bankDetails: {
      accountHolderName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      cancelledChequeUrl: { type: String, required: true },
    },

    /* =========================
       MEDIA (STRICT)
    ========================== */
    media: {
      coverImage: { type: String, required: true },

      exteriorPhotos: {
        type: [String],
        validate: [(v) => v.length >= 2, "Min 2 exterior photos"],
      },

      interiorPhotos: [String],
      roomsOrDiningPhotos: [String],
      kitchenPhotos: [String],

      videoWalkthroughUrl: { type: String },
    },

    /* =========================
       OPERATIONAL DETAILS
    ========================== */
    operations: {
      openingTime: { type: String },
      closingTime: { type: String },

      numberOfRooms: { type: Number },
      numberOfBeds: { type: Number },
      seatingCapacity: { type: Number },

      priceRange: {
        min: { type: Number },
        max: { type: Number },
      },

      amenities: [String],
      cancellationPolicy: { type: String },
    },

    /* =========================
       SERVICE-SPECIFIC (AGENCY / ACTIVITIES)
    ========================== */
    serviceDetails: {
      licenseNumber: { type: String }, // travel agency / guide
      yearsOfExperience: { type: Number },
      operatingRegions: [String],

      emergencySupportAvailable: { type: Boolean },
      insuranceProvided: { type: Boolean },

      activityTypes: [String], // paragliding, scuba, etc
      maxGroupSize: { type: Number },
      safetyGuidelinesUrl: { type: String },
    },

    /* =========================
       ONLINE PRESENCE
    ========================== */
    onlinePresence: {
      websiteUrl: { type: String },
      googleBusinessUrl: { type: String, required: true },
      instagramUrl: { type: String },
      facebookUrl: { type: String },
      otherPlatformLinks: [String],
    },

    /* =========================
       VERIFICATION & TRUST
    ========================== */
    verification: {
      status: {
        type: String,
        enum: ["pending", "under_review", "verified", "rejected", "suspended"],
        default: "pending",
      },

      verifiedAt: { type: Date },
      rejectionReason: { type: String },

      fraudRiskScore: {
        type: Number,
        default: 0,
      },

      manuallyReviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin",
      },
    },

    /* =========================
       PLATFORM CONTROL
    ========================== */
    isActive: { type: Boolean, default: true },
    isLive: { type: Boolean, default: false },
    isBookable: { type: Boolean, default: false },

    priorityScore: { type: Number, default: 0 },

    termsAccepted: {
      type: Boolean,
      required: true,
      validate: (v) => v === true,
    },

    duplicateCheck: {
      status: {
        type: String,
        enum: ["clear", "flagged", "confirmed"],
        default: "clear",
      },
      matchedListingIds: [Schema.Types.ObjectId],
      score: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const BusinessListing = mongoose.model(
  "BusinessListing",
  BusinessListingSchema
);
