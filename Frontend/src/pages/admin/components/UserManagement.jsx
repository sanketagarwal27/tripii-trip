import React, { useState, useEffect } from "react";
import {
  Search,
  User,
  Mail,
  Calendar,
  Shield,
  ShieldAlert,
  Ban,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  KeyRound,
  LayoutGrid,
  UserCheck,
  UserPlus,
  BadgeCheck,
  X,
  ArrowLeft,
} from "lucide-react";

import {
  searchUsers,
  sendOtp,
  promoteUserToAdmin,
  permanentDeleteUser,
  toggleUserBan,
  sendWarning,
  getUserStats,
} from "@/api/admin.js";

/* -------------------- Loader Components -------------------- */

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-500" />
  </div>
);

/* -------------------- Main Component -------------------- */

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userStats, setUserStats] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [pendingAction, setPendingAction] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const [otpInput, setOtpInput] = useState("");
  const [warningForm, setWarningForm] = useState({ subject: "", message: "" });
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [pageLoading, setPageLoading] = useState(true);

  /* -------------------- Load Stats -------------------- */

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getUserStats();
        setUserStats(stats.data);
      } catch (err) {
        console.error("Stats load failed", err);
      } finally {
        setPageLoading(false);
      }
    };
    loadStats();
  }, []);

  /* -------------------- Search -------------------- */

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1 && !selectedUser) {
        setIsSearching(true);
        try {
          const res = await searchUsers(searchQuery);
          setSearchResults(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedUser]);

  /* -------------------- Helpers -------------------- */

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
    setFeedback({});
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSearchQuery("");
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";

  /* -------------------- Actions -------------------- */

  const triggerSimpleAction = (type, label, danger = false) => {
    setPendingAction({ type, label, danger });
    setShowConfirmModal(true);
  };

  const triggerWarningAction = () => {
    setPendingAction({ type: "WARN", label: "Send Warning Email" });
    setWarningForm({ subject: "Official Warning", message: "" });
    setShowConfirmModal(true);
  };

  const triggerSecureAction = async (type, label, danger = false) => {
    setLoadingAction(true);
    try {
      await sendOtp(selectedUser._id);
      setPendingAction({ type, label, danger, requiresOtp: true });
      setOtpInput("");
      setShowConfirmModal(true);
      setFeedback({ type: "success", message: "OTP sent successfully." });
    } catch {
      setFeedback({ type: "error", message: "Failed to send OTP." });
    } finally {
      setLoadingAction(false);
    }
  };

  const executeAction = async () => {
    if (!pendingAction || !selectedUser) return;

    setLoadingAction(true);
    try {
      const id = selectedUser._id;

      if (pendingAction.type === "PROMOTE")
        await promoteUserToAdmin(id, otpInput);

      if (pendingAction.type === "DELETE")
        await permanentDeleteUser(id, otpInput);

      if (pendingAction.type === "BAN" || pendingAction.type === "UNBAN")
        await toggleUserBan(id);

      if (pendingAction.type === "WARN")
        await sendWarning(id, warningForm.subject, warningForm.message);

      setShowConfirmModal(false);
      setSelectedUser(null);
      setFeedback({ type: "success", message: "Action completed." });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Action failed",
      });
    } finally {
      setLoadingAction(false);
      setPendingAction(null);
    }
  };

  /* -------------------- Render -------------------- */

  return (
    <div className="p-6 relative min-h-screen bg-slate-50/50">
      {pageLoading ? (
        <PageLoader />
      ) : (
        <>
          {/* Header */}
          <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 text-teal-600">
            <LayoutGrid /> User Management
          </h2>

          {/* Search */}
          {!selectedUser && (
            <>
              <div className="relative max-w-2xl mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-teal-500"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-teal-500" />
                )}
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  Start searching to find users
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                  {searchResults.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => handleSelectUser(u)}
                      className="p-4 border-b hover:bg-teal-50 cursor-pointer"
                    >
                      <strong>{u.username}</strong> — {u.email}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Selected User */}
          {selectedUser && (
            <>
              <button
                onClick={clearSelection}
                className="mb-4 flex items-center gap-2 text-sm text-gray-600"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-4">
                  {selectedUser.username}
                </h3>

                <button
                  onClick={() =>
                    triggerSecureAction("DELETE", "Delete User", true)
                  }
                  className="bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Delete User
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Action Overlay Loader */}
      {loadingAction && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-200 border-t-teal-500" />
            <span className="font-semibold text-gray-700">
              Processing action...
            </span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="font-bold mb-4">{pendingAction?.label}</h3>

            {pendingAction?.requiresOtp && (
              <input
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full border p-2 rounded mb-4"
                placeholder="Enter OTP"
              />
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="bg-teal-600 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
