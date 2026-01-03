import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    /* =========================
       BASIC PROPERTY INFO (MANDATORY)
    ========================== */
    propertyName: {
      type: String,
      required: true,
      trim: true,
    },

    propertyType: {
      type: String,
      enum: ["hotel", "hostel", "restaurant", "cafe", "homestay"],
      required: true,
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
      required: true,
    },

    yearEstablished: {
      type: Number,
    },

    /* =========================
       OWNER / REPRESENTATIVE (MANDATORY)
    ========================== */
    owner: {
      fullName: { type: String, required: true },
      role: {
        type: String,
        enum: ["owner", "manager", "authorized_signatory"],
        required: true,
      },
      phone: { type: String, required: true },
      email: { type: String, required: true },

      governmentId: {
        idType: {
          type: String,
          enum: ["aadhaar", "pan", "passport", "driving_license"],
        },
        idNumber: { type: String },
        idDocumentUrl: { type: String },
        selfieUrl: { type: String }, // advanced KYC
      },
    },

    /* =========================
       LOCATION & ADDRESS (MANDATORY)
    ========================== */
    address: {
      fullAddress: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: { type: String },

      geoLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },

      addressProofUrl: { type: String }, // utility bill etc.
    },

    /* =========================
       LEGAL DOCUMENTS (MINIMUM + ADVANCED)
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
       BANKING & PAYOUT (MANDATORY BEFORE PAYMENTS)
    ========================== */
    bankDetails: {
      accountHolderName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      cancelledChequeUrl: { type: String },
    },

    /* =========================
       PROPERTY MEDIA (VERY IMPORTANT)
    ========================== */
    media: {
      exteriorPhotos: [String],
      interiorPhotos: [String],
      roomsOrDiningPhotos: [String],
      kitchenPhotos: [String], // restaurants
      videoWalkthroughUrl: { type: String },
    },

    /* =========================
       OPERATIONAL DETAILS
    ========================== */
    operations: {
      openingTime: { type: String },
      closingTime: { type: String },

      numberOfRooms: { type: Number }, // hotels
      numberOfBeds: { type: Number }, // hostels
      seatingCapacity: { type: Number }, // restaurants

      priceRange: {
        min: { type: Number },
        max: { type: Number },
      },

      amenities: [String],
      cancellationPolicy: { type: String },
    },

    /* =========================
       ONLINE PRESENCE (OPTIONAL BUT STRONG)
    ========================== */
    onlinePresence: {
      websiteUrl: { type: String },
      googleBusinessUrl: { type: String },
      instagramUrl: { type: String },
      facebookUrl: { type: String },
      otherPlatformLinks: [String],
    },

    /* =========================
       VERIFICATION & TRUST SYSTEM
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
        default: 0, // 0 = low risk, 100 = high risk
      },

      manuallyReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
    },

    /* =========================
       SYSTEM FLAGS
    ========================== */
    isActive: { type: Boolean, default: true },
    isBookable: { type: Boolean, default: false }, // only true after verification
  },
  { timestamps: true }
);

export default mongoose.model("Property", PropertySchema);
