import React, { useState } from "react";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Building,
  Calendar,
  FileText,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle,
  User,
  CreditCard,
  Globe,
  Image as ImageIcon,
  Clock,
  DollarSign,
  Bed,
  Users,
  Send,
  Shield,
} from "lucide-react";

const BusinessDetailModal = ({
  business,
  onClose,
  onApprove,
  onReject,
  onPending,
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    "Additional Information Required"
  );
  const [emailMessage, setEmailMessage] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(null);

  const isDuplicate = business?.duplicateCheck?.matchedListingIds?.length > 0;
  const duplicateScore = business?.duplicateCheck?.score || 0;

  const allPhotos = [
    ...(business?.media?.coverImage ? [business.media.coverImage] : []),
    ...(business?.media?.exteriorPhotos || []),
    ...(business?.media?.interiorPhotos || []),
    ...(business?.media?.roomsOrDiningPhotos || []),
    ...(business?.media?.kitchenPhotos || []),
  ].filter(Boolean);

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    onReject(business?._id, rejectReason);
    onClose();
  };

  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      alert("Please fill in both subject and message");
      return;
    }
    onPending(business?._id, emailSubject, emailMessage);
    onClose();
  };

  const openImagePreview = (index) => {
    setPreviewIndex(index);
    setImagePreview(allPhotos[index]);
  };

  const nextImage = () => {
    const newIndex = (previewIndex + 1) % allPhotos.length;
    setPreviewIndex(newIndex);
    setImagePreview(allPhotos[newIndex]);
  };

  const prevImage = () => {
    const newIndex = (previewIndex - 1 + allPhotos.length) % allPhotos.length;
    setPreviewIndex(newIndex);
    setImagePreview(allPhotos[newIndex]);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getDuplicateLink = (listingId) => {
    return `https://tripiitrip.com/marketplace/listings/${listingId}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDuplicateEmail = () => {
    const duplicateLinks = business?.duplicateCheck?.matchedListingIds
      ?.map(
        (match, idx) => `${idx + 1}. ${getDuplicateLink(match.id || match._id)}`
      )
      .join("\n");

    setEmailSubject("Duplicate Listing Detected - Action Required");
    setEmailMessage(
      `Dear ${business?.owner?.fullName || "Business Owner"},\n\n` +
        `We have detected that your listing "${business?.businessName}" may be a duplicate of existing listing(s) on our platform.\n\n` +
        `Duplicate Score: ${duplicateScore}/100\n` +
        `Matched Listings:\n${duplicateLinks}\n\n` +
        `Please review these listings and confirm if this is a duplicate or provide additional information to help us verify your listing is unique.\n\n` +
        `Best regards,\nTripii Marketplace Team`
    );
    setShowEmailForm(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-6xl w-full m-4 shadow-2xl">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 flex justify-between items-start rounded-t-lg">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {business?.businessName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Building size={14} />
                  {business?.listingFor}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(business?.createdAt)}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded text-xs font-semibold">
                  {(business?.verification?.status || "pending")
                    .replace("_", " ")
                    .toUpperCase()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Duplicate Warning */}
          {isDuplicate && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 m-6">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="text-red-600 flex-shrink-0"
                  size={24}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 mb-2">
                    Duplicate Listing Detected
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    Found {business?.duplicateCheck.matchedListingIds.length}{" "}
                    potential duplicate(s) with score: {duplicateScore}/100
                  </p>
                  <div className="space-y-2">
                    {business?.duplicateCheck.matchedListingIds.map(
                      (match, idx) => {
                        const link = getDuplicateLink(match.id || match._id);
                        return (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded border border-red-200 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold text-red-700 block mb-1">
                                {match.type === "listing"
                                  ? "LIVE LISTING"
                                  : "SUBMISSION"}
                              </span>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                              >
                                {link} <ExternalLink size={12} />
                              </a>
                            </div>
                            <button
                              onClick={() =>
                                copyToClipboard(link, match.id || match._id)
                              }
                              className="ml-3 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-xs font-semibold text-red-700 flex items-center gap-1"
                            >
                              {copiedLink === (match.id || match._id) ? (
                                <>
                                  <CheckCircle size={12} /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={12} /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>
                  <button
                    onClick={handleDuplicateEmail}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2"
                  >
                    <Send size={16} />
                    Send Duplicate Notice Email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Cover Image */}
            {business?.media?.coverImage && (
              <div
                className="rounded-lg overflow-hidden cursor-pointer"
                onClick={() => openImagePreview(0)}
              >
                <img
                  src={business?.media.coverImage}
                  alt="Cover"
                  className="w-full h-64 object-cover hover:opacity-90 transition"
                />
              </div>
            )}

            {/* Quick Stats */}
            {(business?.operations?.numberOfRooms ||
              business?.operations?.numberOfBeds ||
              business?.operations?.seatingCapacity) && (
              <div className="grid grid-cols-3 gap-4">
                {business?.operations?.numberOfRooms && (
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <Building
                      size={24}
                      className="mx-auto mb-2 text-blue-600"
                    />
                    <div className="text-2xl font-bold">
                      {business.operations.numberOfRooms}
                    </div>
                    <div className="text-sm text-gray-600">Rooms</div>
                  </div>
                )}
                {business?.operations?.numberOfBeds && (
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <Bed size={24} className="mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">
                      {business.operations.numberOfBeds}
                    </div>
                    <div className="text-sm text-gray-600">Beds</div>
                  </div>
                )}
                {business?.operations?.seatingCapacity && (
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <Users size={24} className="mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">
                      {business.operations.seatingCapacity}
                    </div>
                    <div className="text-sm text-gray-600">Seating</div>
                  </div>
                )}
              </div>
            )}

            {/* Operations */}
            {business?.operations && (
              <Section title="Operations" icon={<Clock size={18} />}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow
                    label="Opening Time"
                    value={business?.operations?.openingTime || "N/A"}
                  />
                  <InfoRow
                    label="Closing Time"
                    value={business?.operations?.closingTime || "N/A"}
                  />
                </div>
                {business?.operations?.priceRange && (
                  <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center gap-2 text-green-800 font-semibold">
                      <DollarSign size={16} />
                      Price Range: ₹{business.operations.priceRange.min} - ₹
                      {business.operations.priceRange.max}
                    </div>
                  </div>
                )}
                {business?.operations?.amenities?.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                      Amenities:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {business.operations.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Owner Details */}
            <Section
              title="Owner / Contact Information"
              icon={<User size={18} />}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <InfoRow
                  label="Full Name"
                  value={business?.owner?.fullName}
                  icon={<User size={14} />}
                />
                <InfoRow label="Role" value={business?.owner?.role} />
                <InfoRow
                  label="Phone"
                  value={business?.owner?.phone}
                  icon={<Phone size={14} />}
                  copyable
                />
                <InfoRow
                  label="Email"
                  value={business?.owner?.email}
                  icon={<Mail size={14} />}
                  copyable
                />
              </div>
              {business?.owner?.governmentId && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <InfoRow
                    label="Government ID"
                    value={`${
                      business.owner.governmentId.idType?.toUpperCase() || "N/A"
                    } - ${business.owner.governmentId.idNumber || "N/A"}`}
                    icon={<Shield size={14} />}
                  />
                </div>
              )}
            </Section>

            {/* Address */}
            <Section title="Location Details" icon={<MapPin size={18} />}>
              <InfoRow
                label="Full Address"
                value={business?.address?.fullAddress}
              />
              <div className="grid md:grid-cols-3 gap-4 mt-3">
                <InfoRow label="City" value={business?.address?.city} />
                <InfoRow label="State" value={business?.address?.state} />
                <InfoRow label="Pincode" value={business?.address?.pincode} />
              </div>
              {(business?.address?.geoLocation?.lat ||
                business?.address?.geoLocation?.coordinates?.[1]) && (
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <InfoRow
                    label="Coordinates"
                    value={
                      business?.address?.geoLocation?.lat
                        ? `${business.address.geoLocation.lat}, ${business.address.geoLocation.lng}`
                        : `${business.address.geoLocation.coordinates[1]}, ${business.address.geoLocation.coordinates[0]}`
                    }
                  />
                </div>
              )}
            </Section>

            {/* Bank Details */}
            <Section
              title="Banking Information"
              icon={<CreditCard size={18} />}
            >
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 space-y-3">
                <InfoRow
                  label="Account Holder"
                  value={business?.bankDetails?.accountHolderName}
                />
                <InfoRow
                  label="Account Number"
                  value={business?.bankDetails?.accountNumber}
                  copyable
                />
                <InfoRow
                  label="IFSC Code"
                  value={business?.bankDetails?.ifscCode}
                  copyable
                />
                <DocLink
                  label="Cancelled Cheque"
                  url={business?.bankDetails?.cancelledChequeUrl}
                />
              </div>
            </Section>

            {/* Online Presence */}
            <Section title="Online Presence" icon={<Globe size={18} />}>
              <div className="space-y-2">
                <LinkRow
                  label="Website"
                  url={business?.onlinePresence?.websiteUrl}
                />
                <LinkRow
                  label="Google Business"
                  url={business?.onlinePresence?.googleBusinessUrl}
                />
                <LinkRow
                  label="Instagram"
                  url={business?.onlinePresence?.instagramUrl}
                />
                <LinkRow
                  label="Facebook"
                  url={business?.onlinePresence?.facebookUrl}
                />
              </div>
            </Section>

            {/* Photo Gallery */}
            {allPhotos.length > 1 && (
              <Section title="Photo Gallery" icon={<ImageIcon size={18} />}>
                <div className="grid grid-cols-4 gap-3">
                  {allPhotos.slice(1).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition"
                      onClick={() => openImagePreview(idx + 1)}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Verification Info */}
            <Section title="Verification Details" icon={<Shield size={18} />}>
              <div className="grid md:grid-cols-2 gap-4">
                <InfoRow
                  label="Status"
                  value={business?.verification?.status || "pending"}
                />
                <InfoRow
                  label="Fraud Risk Score"
                  value={`${business?.verification?.fraudRiskScore || 0}/100`}
                />
                {business?.verification?.rejectionReason && (
                  <div className="md:col-span-2">
                    <InfoRow
                      label="Rejection Reason"
                      value={business.verification.rejectionReason}
                    />
                  </div>
                )}
              </div>
            </Section>
          </div>

          {/* Action Footer */}
          <div className="bg-gray-50 border-t p-6">
            {!showRejectForm && !showEmailForm && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to approve this listing?"
                      )
                    ) {
                      onApprove(business?._id);
                      onClose();
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Approve Listing
                </button>
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  Request Changes
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Reject Listing
                </button>
              </div>
            )}

            {showRejectForm && (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <h4 className="font-semibold text-red-900 mb-2">
                    Rejection Form
                  </h4>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full border border-red-300 rounded p-3 text-sm"
                    rows="4"
                    placeholder="Enter detailed rejection reason..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason("");
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showEmailForm && (
              <div className="space-y-3">
                <div className="bg-orange-50 border border-orange-200 rounded p-4">
                  <h4 className="font-semibold text-orange-900 mb-3">
                    Send Email to Business Owner
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full border border-orange-300 rounded p-2 text-sm"
                        placeholder="Subject of the email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Message
                      </label>
                      <textarea
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        className="w-full border border-orange-300 rounded p-3 text-sm"
                        rows="6"
                        placeholder="Compose your message here..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailSubject.trim() || !emailMessage.trim()}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Send Email & Mark Under Review
                  </button>
                  <button
                    onClick={() => {
                      setShowEmailForm(false);
                      setEmailSubject("Additional Information Required");
                      setEmailMessage("");
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-60 flex items-center justify-center">
          <button
            onClick={() => setImagePreview(null)}
            className="absolute top-4 right-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
          >
            <X size={28} />
          </button>

          {allPhotos.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 p-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 p-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white"
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}

          <div className="max-w-6xl w-full flex flex-col items-center p-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
            <div className="bg-black bg-opacity-70 text-white mt-4 px-6 py-3 rounded-full text-sm font-semibold">
              {previewIndex + 1} / {allPhotos.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper Components
const Section = ({ title, icon, children }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-4 pb-3 border-b">
      {icon}
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const InfoRow = ({ icon, label, value, copyable }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-start gap-2 text-sm">
      {icon && <span className="text-gray-400 mt-0.5">{icon}</span>}
      <span className="font-semibold text-gray-700 min-w-[120px]">
        {label}:
      </span>
      <span className="text-gray-900 flex-1">{value || "N/A"}</span>
      {copyable && value && (
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
        >
          {copied ? (
            <CheckCircle size={14} className="text-green-600" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      )}
    </div>
  );
};

const DocLink = ({ label, url }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="font-semibold text-gray-700 min-w-[120px]">{label}:</span>
    {url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
      >
        View Document <ExternalLink size={14} />
      </a>
    ) : (
      <span className="text-gray-400">Not provided</span>
    )}
  </div>
);

const LinkRow = ({ label, url }) => (
  <div className="flex items-start gap-2 text-sm">
    <span className="font-semibold text-gray-700 min-w-[120px]">{label}:</span>
    {url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate hover:underline flex-1"
      >
        <Globe size={14} className="flex-shrink-0" />
        <span className="truncate">{url}</span>
        <ExternalLink size={14} className="flex-shrink-0" />
      </a>
    ) : (
      <span className="text-gray-400">N/A</span>
    )}
  </div>
);

export default BusinessDetailModal;
