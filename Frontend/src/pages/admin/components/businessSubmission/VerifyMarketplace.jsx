import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Check,
  X,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getAllBusinessListingsAdmin,
  approveBusinessListingAdmin,
  rejectBusinessListingAdmin,
  pendingBusinessListingWithEmailAdmin,
} from "@/api/admin";
import {
  setBusinessListings,
  setLoading,
  updateBusinessListingStatus,
  setError,
} from "@/redux/adminSlice.js";
import BusinessDetailModal from "./BusinessDetailModal";

const VerifyMarketplace = () => {
  const dispatch = useDispatch();
  const { businessListings, loading } = useSelector((state) => state.admin);
  const [currentTab, setCurrentTab] = useState("Pending");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      dispatch(setLoading(true));
      const res = await getAllBusinessListingsAdmin();
      dispatch(setBusinessListings(res.data));
    } catch (error) {
      console.error("Error fetching listings:", error);
      dispatch(setError(error.message));
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveBusinessListingAdmin(id);
      dispatch(updateBusinessListingStatus({ id, status: "verified" }));
      alert("Listing approved successfully!");
    } catch (error) {
      console.error("Approve error:", error);
      alert("Failed to approve listing");
    }
  };

  const handleReject = async (id, reason = "Does not meet requirements") => {
    try {
      await rejectBusinessListingAdmin(id, reason);
      dispatch(
        updateBusinessListingStatus({
          id,
          status: "rejected",
          rejectionReason: reason,
        })
      );
      alert("Listing rejected");
    } catch (error) {
      console.error("Reject error:", error);
      alert("Failed to reject listing");
    }
  };

  const handlePending = async (id, subject, message) => {
    try {
      await pendingBusinessListingWithEmailAdmin(id, subject, message);
      dispatch(updateBusinessListingStatus({ id, status: "under_review" }));
      alert("Email sent and listing marked under review");
    } catch (error) {
      console.error("Pending error:", error);
      alert("Failed to send email");
    }
  };

  const getListingStatus = (listing) => {
    if (listing.duplicateCheck?.matchedListingIds?.length > 0) {
      return "Duplicate";
    }
    const status = listing.verification?.status || "pending";
    if (status === "under_review") return "Under Review";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const counts = {
    Pending: businessListings.filter(
      (l) =>
        l.verification?.status === "pending" &&
        !l.duplicateCheck?.matchedListingIds?.length
    ).length,
    "Under Review": businessListings.filter(
      (l) => l.verification?.status === "under_review"
    ).length,
    Duplicate: businessListings.filter(
      (l) => l.duplicateCheck?.matchedListingIds?.length > 0
    ).length,
    Verified: businessListings.filter(
      (l) => l.verification?.status === "verified"
    ).length,
    Rejected: businessListings.filter(
      (l) => l.verification?.status === "rejected"
    ).length,
  };

  const listingTypes = [
    "All",
    ...new Set(businessListings.map((l) => l.listingFor).filter(Boolean)),
  ];

  let visibleListings = businessListings.filter((listing) => {
    const status = getListingStatus(listing);
    const matchesTab =
      currentTab === "Under Review"
        ? status === "Under Review"
        : status === currentTab;
    const matchesSearch =
      !searchQuery ||
      listing.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.owner?.fullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      listing.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "All" || listing.listingFor === filterType;
    return matchesTab && matchesSearch && matchesType;
  });

  visibleListings = [...visibleListings].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "name":
        return (a.businessName || "").localeCompare(b.businessName || "");
      case "duplicateScore":
        return (b.duplicateCheck?.score || 0) - (a.duplicateCheck?.score || 0);
      default:
        return 0;
    }
  });

  const exportToCSV = () => {
    const headers = [
      "Business Name",
      "Type",
      "Status",
      "Owner",
      "Email",
      "Phone",
      "City",
      "Submitted Date",
    ];
    const rows = visibleListings.map((l) => [
      l.businessName || "",
      l.listingFor || "",
      getListingStatus(l),
      l.owner?.fullName || "",
      l.owner?.email || "",
      l.owner?.phone || "",
      l.address?.city || "",
      new Date(l.createdAt).toLocaleDateString(),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `listings-${currentTab.toLowerCase()}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Marketplace Verification
              </h1>
              <p className="text-gray-600 mt-1">
                Review and manage business submissions
              </p>
            </div>
            <button
              onClick={fetchListings}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { status: "Pending", color: "yellow" },
            { status: "Under Review", color: "orange" },
            { status: "Duplicate", color: "red" },
            { status: "Verified", color: "green" },
            { status: "Rejected", color: "gray" },
          ].map(({ status, color }) => (
            <button
              key={status}
              onClick={() => setCurrentTab(status)}
              className={`p-4 rounded-lg border-2 transition ${
                currentTab === status
                  ? `border-${color}-500 bg-${color}-50`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className={`text-2xl font-bold mb-1 text-${color}-600`}>
                {counts[status]}
              </div>
              <div className="text-sm font-semibold text-gray-700">
                {status}
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="col-span-2 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name, owner, email, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {listingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="duplicateScore">Duplicate Score</option>
            </select>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {visibleListings.length} of {businessListings.length}{" "}
              listings
            </span>
            <button
              onClick={exportToCSV}
              disabled={visibleListings.length === 0}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded text-gray-700 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <RefreshCw
                className="animate-spin text-blue-600 mb-4"
                size={48}
              />
              <p className="text-gray-500">Loading listings...</p>
            </div>
          ) : visibleListings.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600 font-semibold mb-2">
                No {currentTab.toLowerCase()} listings found
              </p>
              <p className="text-gray-500 text-sm">
                {searchQuery || filterType !== "All"
                  ? "Try adjusting your filters"
                  : "No listings in this category"}
              </p>
            </div>
          ) : (
            visibleListings.map((listing) => (
              <BusinessListingCard
                key={listing._id}
                data={listing}
                onApprove={handleApprove}
                onReject={handleReject}
                onPending={handlePending}
                onClick={() => setSelectedBusiness(listing)}
              />
            ))
          )}
        </div>
      </div>

      {selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onPending={handlePending}
        />
      )}
    </div>
  );
};

const BusinessListingCard = ({
  data,
  onApprove,
  onReject,
  onPending,
  onClick,
}) => {
  const isDuplicate = data.duplicateCheck?.matchedListingIds?.length > 0;
  const duplicateCount = data.duplicateCheck?.matchedListingIds?.length || 0;
  const duplicateScore = data.duplicateCheck?.score || 0;
  const status = data.verification?.status || "pending";

  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    under_review: "bg-orange-100 text-orange-800 border-orange-300",
    verified: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border-2 ${
        isDuplicate ? "border-red-400" : "border-gray-200"
      } hover:border-blue-400 hover:shadow-lg transition cursor-pointer overflow-hidden`}
    >
      <div className="h-48 bg-gray-200 relative">
        {data.media?.coverImage ? (
          <img
            src={data.media.coverImage}
            alt={data.businessName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AlertCircle size={48} className="text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 left-3 px-3 py-1 bg-white rounded-md shadow text-xs font-bold">
          {data.listingFor}
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`px-2 py-1 rounded-md text-xs font-bold border ${
              statusColors[status] || statusColors.pending
            }`}
          >
            {status.replace("_", " ").toUpperCase()}
          </span>
        </div>
        {isDuplicate && (
          <div className="absolute bottom-3 left-3 right-3 bg-red-600 text-white px-3 py-2 rounded text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={14} />
            {duplicateCount} DUPLICATE{duplicateCount > 1 ? "S" : ""} FOUND
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
          {data.businessName}
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <MapPin size={14} />
          <span className="truncate">
            {data.address?.city}, {data.address?.state}
          </span>
        </div>

        <div className="bg-gray-50 rounded p-3 mb-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-gray-500" />
            <span className="truncate">{data.owner?.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={12} className="text-gray-500" />
            <span className="truncate">{data.owner?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={12} />
            <span className="text-xs">
              {new Date(data.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {isDuplicate && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-red-900">
                Duplicate Score
              </span>
              <span className="text-lg font-bold text-red-600">
                {duplicateScore}/100
              </span>
            </div>
          </div>
        )}

        {status === "rejected" && data.verification?.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
            <p className="text-xs font-semibold text-red-700 mb-1">
              Rejection Reason:
            </p>
            <p className="text-xs text-red-600 line-clamp-2">
              {data.verification.rejectionReason}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {status === "pending" && !isDuplicate && (
            <>
              <button
                onClick={(e) => handleAction(e, () => onApprove(data._id))}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
              >
                <Check size={16} />
                Approve
              </button>
              <button
                onClick={(e) =>
                  handleAction(e, () =>
                    onReject(data._id, "Does not meet requirements")
                  )
                }
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
              >
                <X size={16} />
                Reject
              </button>
            </>
          )}

          {status === "pending" && isDuplicate && (
            <button
              onClick={(e) =>
                handleAction(e, () =>
                  onPending(
                    data._id,
                    "Duplicate Detected",
                    "We found potential duplicates."
                  )
                )
              }
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
            >
              <AlertTriangle size={16} />
              Review
            </button>
          )}

          {status === "under_review" && (
            <>
              <button
                onClick={(e) => handleAction(e, () => onApprove(data._id))}
                className="flex-1 border-2 border-green-600 text-green-700 hover:bg-green-50 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
              >
                <Check size={16} />
                Approve
              </button>
              <button
                onClick={(e) =>
                  handleAction(e, () =>
                    onReject(data._id, "Does not meet requirements")
                  )
                }
                className="flex-1 border-2 border-red-600 text-red-700 hover:bg-red-50 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
              >
                <X size={16} />
                Reject
              </button>
            </>
          )}

          {status === "verified" && (
            <button
              onClick={(e) =>
                handleAction(e, () =>
                  onReject(data._id, "Verification revoked")
                )
              }
              className="flex-1 border-2 border-red-600 text-red-700 hover:bg-red-50 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
            >
              <X size={16} />
              Revoke
            </button>
          )}

          {status === "rejected" && (
            <button
              onClick={(e) => handleAction(e, () => onApprove(data._id))}
              className="flex-1 border-2 border-green-600 text-green-700 hover:bg-green-50 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
            >
              <Check size={16} />
              Re-Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyMarketplace;
