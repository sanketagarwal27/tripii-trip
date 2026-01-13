import React, { useState, useEffect } from "react";
import {
  Users,
  MessageSquare,
  ShieldAlert,
  Search,
  CheckCircle,
  TrendingUp,
  Globe,
  Lock,
  Loader2,
  Trash2,
  BadgeCheck,
  Ban,
  X,
  LayoutGrid,
} from "lucide-react";
import {
  getCommunities,
  verifyCommunity,
  deleteCommunity,
  updateCommunityStatus,
} from "@/api/admin";
import CreateCommunityOverlay from "@/components/community/CreateCommunityOverlay";

const ManageCommunities = () => {
  // --- State ---
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pages: 0 });
  const [showOverlay, setShowOverlay] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");

  // Status Modal State
  const [selectedComm, setSelectedComm] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // --- Fetch Data ---
  const loadCommunities = async () => {
    setLoading(true);
    try {
      const { data } = await getCommunities({
        search,
        status: filterStatus,
        page,
        limit: 10,
      });
      setCommunities(data.communities);
      setStats(data.pagination);
    } catch (error) {
      console.error("Failed to fetch communities", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCommunities();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, page, filterStatus]);

  // --- Actions ---
  const handleVerify = async (id) => {
    try {
      setCommunities((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isVerified: !c.isVerified } : c))
      );
      await verifyCommunity(id);
    } catch (error) {
      loadCommunities();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      setCommunities((prev) => prev.filter((c) => c.id !== id));
      await deleteCommunity(id);
    } catch (error) {
      loadCommunities();
    }
  };

  // Open the modal
  const openStatusModal = (community) => {
    setSelectedComm(community);
    setShowStatusModal(true);
  };

  // Submit the new status
  const handleStatusUpdate = async (newStatus) => {
    if (!selectedComm) return;
    setUpdatingStatus(true);
    try {
      await updateCommunityStatus(selectedComm.id, newStatus);

      setCommunities((prev) =>
        prev.map((c) =>
          c.id === selectedComm.id ? { ...c, status: newStatus } : c
        )
      );

      setShowStatusModal(false);
      setSelectedComm(null);
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="p-6 relative min-h-screen bg-slate-50/50">
      {/* Decorative Background Blob - Teal Variant */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-teal-50 to-transparent -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center gap-2">
            <LayoutGrid className="text-teal-600" /> Manage Communities
          </h2>
          <p className="text-gray-500 mt-1">
            Oversee, moderate, and grow platform's groups.
          </p>
        </div>
        <button
          className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-teal-200 hover:shadow-teal-300 hover:scale-[1.02] transition-all"
          onClick={() => setShowOverlay(true)}
        >
          + Create Official Community
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center ring-1 ring-gray-100">
        <div className="relative w-full md:w-96 group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all outline-none text-gray-700 placeholder-gray-400 font-medium"
          />
        </div>
        <select
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-600 font-medium focus:ring-2 focus:ring-teal-100 cursor-pointer outline-none hover:bg-gray-100 transition-colors"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
          <option value="Banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center w-full gap-3">
            <Loader2 className="animate-spin text-teal-600" size={40} />
            <p className="text-gray-400 font-medium animate-pulse">
              Loading communities...
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead className="bg-teal-50/50 border-b border-teal-100">
                <tr>
                  <th className="p-5 text-xs font-bold text-teal-900 uppercase tracking-wider">
                    Community
                  </th>
                  <th className="p-5 text-xs font-bold text-teal-900 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="p-5 text-xs font-bold text-teal-900 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="p-5 text-xs font-bold text-teal-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-5 text-xs font-bold text-teal-900 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {communities.length > 0 ? (
                  communities.map((comm) => (
                    <tr
                      key={comm.id}
                      className="hover:bg-teal-50/30 transition-colors duration-200"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          {/* Avatar - Teal/Cyan Gradient */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-600 flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
                            {comm.avatar ? (
                              <img
                                src={comm.avatar}
                                alt={comm.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              comm.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-gray-800 text-[15px]">
                                {comm.name}
                              </p>
                              {comm.isVerified && (
                                <BadgeCheck
                                  size={16}
                                  className="text-teal-500 fill-teal-50"
                                />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              Created by{" "}
                              <span className="text-gray-700">
                                {comm.creator}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            comm.type === "Public"
                              ? "bg-cyan-50 text-cyan-700 border border-cyan-100"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {comm.type === "Public" ? (
                            <Globe size={14} />
                          ) : (
                            <Lock size={14} />
                          )}
                          {comm.type}
                        </span>
                      </td>

                      {/* --- STATS COLUMN (Teal/Emerald theme) --- */}
                      <td className="p-5">
                        <div className="flex flex-col gap-2">
                          {/* Users Count - Cyan */}
                          <div
                            className="flex items-center gap-2 text-sm text-gray-600 group cursor-default"
                            title="Total Members"
                          >
                            <div className="p-1 rounded bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 transition-colors">
                              <Users size={14} />
                            </div>
                            <span className="font-semibold text-gray-700">
                              {comm.members.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400">
                              members
                            </span>
                          </div>

                          {/* Posts Count - Emerald (Nature/Trip vibe) */}
                          <div
                            className="flex items-center gap-2 text-sm text-gray-600 group cursor-default"
                            title="Total Posts"
                          >
                            <div className="p-1 rounded bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                              <MessageSquare size={14} />
                            </div>
                            <span className="font-semibold text-gray-700">
                              {comm.posts.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400">posts</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-5">
                        <StatusBadge status={comm.status} />
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Verify Button - Teal */}
                          <button
                            onClick={() => handleVerify(comm.id)}
                            title={
                              comm.isVerified
                                ? "Revoke Verification"
                                : "Verify Community"
                            }
                            className={`p-2 rounded-lg transition-all ${
                              comm.isVerified
                                ? "text-teal-600 bg-teal-50 hover:bg-teal-100"
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            }`}
                          >
                            <BadgeCheck size={18} />
                          </button>

                          {/* Change Status Button - Orange (Universal warning) */}
                          <button
                            onClick={() => openStatusModal(comm)}
                            title="Change Status"
                            className="p-2 hover:bg-orange-50 text-gray-400 hover:text-orange-600 rounded-lg transition-all"
                          >
                            <Ban size={18} />
                          </button>

                          {/* Delete Button - Red */}
                          <button
                            onClick={() => handleDelete(comm.id)}
                            title="Delete"
                            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Search size={32} className="opacity-20" />
                        <p>No communities found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
              <span className="text-sm font-medium text-gray-500">
                Page <span className="text-gray-900">{page}</span> of{" "}
                {stats.pages || 1}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                  Previous
                </button>
                <button
                  disabled={page >= stats.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showOverlay && (
        <CreateCommunityOverlay
          isOpen={showOverlay}
          onClose={() => setShowOverlay(false)}
        />
      )}

      {/* --- STATUS CHANGE MODAL --- */}
      {showStatusModal && selectedComm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Change Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              Select a new status for{" "}
              <span className="font-bold text-teal-700">
                {selectedComm.name}
              </span>
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleStatusUpdate("Active")}
                disabled={updatingStatus}
                className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all group
                ${
                  selectedComm.status === "Active"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                    : "bg-white border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 text-gray-600"
                }
                `}
              >
                <span className="font-semibold flex items-center gap-2">
                  <CheckCircle
                    size={18}
                    className={
                      selectedComm.status === "Active"
                        ? "text-emerald-600"
                        : "text-gray-300 group-hover:text-emerald-400"
                    }
                  />{" "}
                  Active
                </span>
                {selectedComm.status === "Active" && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => handleStatusUpdate("Suspended")}
                disabled={updatingStatus}
                className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all group
                ${
                  selectedComm.status === "Suspended"
                    ? "bg-amber-50 border-amber-500 text-amber-800 shadow-sm"
                    : "bg-white border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 text-gray-600"
                }
                `}
              >
                <span className="font-semibold flex items-center gap-2">
                  <ShieldAlert
                    size={18}
                    className={
                      selectedComm.status === "Suspended"
                        ? "text-amber-600"
                        : "text-gray-300 group-hover:text-amber-400"
                    }
                  />{" "}
                  Suspended
                </span>
                {selectedComm.status === "Suspended" && (
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>

              <button
                onClick={() => handleStatusUpdate("Banned")}
                disabled={updatingStatus}
                className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all group
                ${
                  selectedComm.status === "Banned"
                    ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm"
                    : "bg-white border-gray-100 hover:border-rose-200 hover:bg-rose-50/50 text-gray-600"
                }
                `}
              >
                <span className="font-semibold flex items-center gap-2">
                  <Ban
                    size={18}
                    className={
                      selectedComm.status === "Banned"
                        ? "text-rose-600"
                        : "text-gray-300 group-hover:text-rose-400"
                    }
                  />{" "}
                  Banned
                </span>
                {selectedComm.status === "Banned" && (
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
            </div>

            {updatingStatus && (
              <div className="mt-6 p-2 rounded-lg bg-teal-50 text-teal-700 text-sm font-medium flex items-center justify-center gap-2 animate-pulse">
                <Loader2 className="animate-spin" size={16} /> Updating
                status...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Suspended: "bg-amber-100 text-amber-700 border-amber-200",
    Banned: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
        styles[status] || "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
};

export default ManageCommunities;
