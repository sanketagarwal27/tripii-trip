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
  XCircle,
  AlertTriangle,
  Loader2,
  KeyRound,
} from "lucide-react";

import {
  searchUsers,
  sendOtp,
  promoteUserToAdmin,
  permanentDeleteUser,
  toggleUserBan,
  sendWarning,
} from "@/api/admin.js";

const UserManagement = () => {
  // --- States ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Action State
  // Type can be: 'BAN', 'UNBAN', 'PROMOTE', 'DELETE', 'WARN', 'VERIFY'
  const [pendingAction, setPendingAction] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Form Inputs for Modal
  const [otpInput, setOtpInput] = useState("");
  const [warningForm, setWarningForm] = useState({ subject: "", message: "" });

  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // --- Search Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1 && !selectedUser) {
        setIsSearching(true);
        try {
          const response = await searchUsers(searchQuery);
          setSearchResults(response.data);
        } catch (error) {
          console.error("Search error", error);
        } finally {
          setIsSearching(false);
        }
      } else if (searchQuery.trim().length <= 1) {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedUser]);

  // --- Helpers ---
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
    setFeedback({ type: "", message: "" });
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSearchQuery("");
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // --- Action Triggers ---

  // 1. Simple Actions (Ban/Unban/Verify)
  const triggerSimpleAction = (actionType, label, danger = false) => {
    setPendingAction({ type: actionType, label, danger });
    setShowConfirmModal(true);
  };

  // 2. Warning Action (Opens Form)
  const triggerWarningAction = () => {
    setPendingAction({
      type: "WARN",
      label: "Send Warning Email",
      danger: false,
    });
    setWarningForm({ subject: "Official Warning", message: "" });
    setShowConfirmModal(true);
  };

  // 3. Secure Actions (Promote/Delete) -> Requires OTP
  const triggerSecureAction = async (actionType, label, danger = false) => {
    if (!selectedUser) return;

    setLoadingAction(true); // Show loading while requesting OTP
    try {
      // Step 1: Request OTP from backend
      await sendOtp(selectedUser._id);

      // Step 2: Open Modal for OTP Entry
      setPendingAction({ type: actionType, label, danger, requiresOtp: true });
      setOtpInput(""); // Reset OTP field
      setShowConfirmModal(true);
      setFeedback({ type: "success", message: "OTP sent to your email." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to send OTP.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Main Execution Logic ---
  const executeAction = async () => {
    if (!pendingAction || !selectedUser) return;
    setLoadingAction(true);
    setFeedback({ type: "", message: "" });

    try {
      let response;
      const userId = selectedUser._id;

      switch (pendingAction.type) {
        // --- OTP Protected Actions ---
        case "PROMOTE":
          if (!otpInput) throw new Error("OTP is required");
          response = await promoteUserToAdmin(userId, otpInput);
          setSelectedUser((prev) => ({ ...prev, role: "admin" }));
          break;

        case "DELETE":
          if (!otpInput) throw new Error("OTP is required");
          response = await permanentDeleteUser(userId, otpInput); // Assuming API takes OTP
          setSelectedUser(null); // Remove from view
          break;

        // --- Standard Actions ---
        case "BAN":
        case "UNBAN":
          response = await toggleUserBan(userId);
          // Toggle local state based on result
          setSelectedUser((prev) => ({
            ...prev,
            status: prev.status === "banned" ? "active" : "banned",
          }));
          break;

        case "WARN":
          if (!warningForm.message) throw new Error("Message is required");
          await sendWarning(userId, warningForm.subject, warningForm.message);
          break;

        case "VERIFY":
          // await verifyUser(userId);
          setSelectedUser((prev) => ({ ...prev, isVerified: true }));
          break;

        default:
          break;
      }

      setFeedback({
        type: "success",
        message:
          response?.message ||
          `Action '${pendingAction.label}' completed successfully.`,
      });
      setShowConfirmModal(false);
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message || error.message || "Action failed.",
      });
    } finally {
      setLoadingAction(false);
      setPendingAction(null);
    }
  };

  // --- Render Modal Content Dynamically ---
  const renderModalContent = () => {
    // 1. Warning Form
    if (pendingAction?.type === "WARN") {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={warningForm.subject}
              onChange={(e) =>
                setWarningForm({ ...warningForm, subject: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              rows={4}
              value={warningForm.message}
              onChange={(e) =>
                setWarningForm({ ...warningForm, message: e.target.value })
              }
              placeholder="Enter warning details..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      );
    }

    // 2. OTP Input Form (Promote/Delete)
    if (pendingAction?.requiresOtp) {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
            <KeyRound className="text-blue-600 mt-1" size={18} />
            <p className="text-sm text-blue-800">
              An OTP has been sent to your registered admin email. Please enter
              it below to confirm this high-security action.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) =>
                setOtpInput(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="123456"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest font-mono"
            />
          </div>
        </div>
      );
    }

    // 3. Standard Confirmation Message
    return (
      <p className="text-gray-600 mb-6">
        Are you sure you want to <strong>{pendingAction?.label}</strong> for
        user{" "}
        <span className="font-semibold text-gray-900">
          {selectedUser?.username}
        </span>
        ?
        {pendingAction?.danger && (
          <span className="block mt-2 text-red-600 text-sm font-medium">
            This action may be irreversible.
          </span>
        )}
      </p>
    );
  };

  return (
    <div className="p-6 w-full max-w-7xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <User className="text-blue-600" />
        User Management
      </h1>

      {/* --- Feedback Alert --- */}
      {feedback.message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2
          ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
          {feedback.message}
          <button
            onClick={() => setFeedback({})}
            className="ml-auto hover:underline opacity-70"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* --- Search Area --- */}
      {!selectedUser && (
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by username, email or full name..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <Loader2
                className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500"
                size={20}
              />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden divide-y divide-gray-50 animate-in fade-in slide-in-from-top-4">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className="p-4 hover:bg-blue-50 cursor-pointer transition-colors flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar.url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.username[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-700">
                      {user.fullName || "Unknown Name"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      @{user.username} • {user.email}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Badge status={user.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Selected User Dashboard --- */}
      {selectedUser && (
        <div className="animate-in zoom-in-95 duration-300">
          <button
            onClick={clearSelection}
            className="mb-4 text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            ← Back to Search
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-32 h-32 bg-gray-100 rounded-full mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-md relative">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar.url}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={64} className="text-gray-300" />
                  )}
                  {selectedUser.isVerified && (
                    <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
                      <CheckCircle size={16} />
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedUser.fullName || selectedUser.username}
                </h2>
                <p className="text-gray-500 mb-4">@{selectedUser.username}</p>

                <div className="flex gap-2 mb-6">
                  <Badge status={selectedUser.status} />
                  <Badge role={selectedUser.role} />
                </div>

                <div className="w-full border-t border-gray-100 pt-4 space-y-3 text-left">
                  <InfoRow
                    icon={<Mail size={16} />}
                    label="Email"
                    value={selectedUser.email}
                  />
                  <InfoRow
                    icon={<Calendar size={16} />}
                    label="Joined"
                    value={formatDate(selectedUser.createdAt)}
                  />
                  <InfoRow
                    icon={<Shield size={16} />}
                    label="ID"
                    value={selectedUser._id}
                    isMono
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Management Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* 🔒 SECURITY CHECK: If user is Admin, BLOCK EVERYTHING */}
              {selectedUser.role === "admin" ? (
                <div className="h-full min-h-[400px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Shield size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Admin Access Protected
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                    You are viewing an Administrator account. <br />
                    To prevent accidental lockouts or privilege escalation,
                    <span className="font-semibold text-gray-700">
                      {" "}
                      no actions can be performed on this user
                    </span>{" "}
                    from this panel.
                  </p>
                </div>
              ) : (
                /* 🔓 NORMAL USER: Show All Controls */
                <>
                  {/* Access Control */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <ShieldCheckIcon /> Access Control
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ActionCard
                        icon={<Shield className="text-purple-600" />}
                        title="Promote to Admin"
                        desc="Grant full access to dashboard. Requires OTP."
                        onClick={() =>
                          triggerSecureAction("PROMOTE", "Promote to Admin")
                        }
                      />

                      {!selectedUser.isVerified && (
                        <ActionCard
                          icon={<CheckCircle className="text-blue-600" />}
                          title="Manually Verify"
                          desc="Mark this account as trusted."
                          onClick={() =>
                            triggerSimpleAction("VERIFY", "Verify User")
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* Status & Discipline */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-amber-500" /> Account
                      Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.status !== "banned" ? (
                        <ActionCard
                          icon={<Ban className="text-red-600" />}
                          title="Ban User"
                          desc="Revoke login access immediately."
                          danger
                          onClick={() =>
                            triggerSimpleAction("BAN", "Ban User", true)
                          }
                        />
                      ) : (
                        <ActionCard
                          icon={<CheckCircle className="text-green-600" />}
                          title="Unban User"
                          desc="Restore login access."
                          onClick={() =>
                            triggerSimpleAction("UNBAN", "Unban User")
                          }
                        />
                      )}

                      <ActionCard
                        icon={<Mail className="text-gray-600" />}
                        title="Send Warning"
                        desc="Send an official warning email."
                        onClick={triggerWarningAction}
                      />
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                    <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                      <ShieldAlert className="text-red-600" /> Danger Zone
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={() =>
                          triggerSecureAction(
                            "DELETE",
                            "Delete Account Permanently",
                            true
                          )
                        }
                        className="bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-sm"
                      >
                        <Trash2 size={18} /> Delete Account Permanently
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Dynamic Confirmation/Form Modal --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`p-3 rounded-full ${
                  pendingAction?.danger
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {pendingAction?.danger ? (
                  <AlertTriangle size={24} />
                ) : (
                  <Shield size={24} />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {pendingAction?.label || "Confirm Action"}
              </h3>
            </div>

            {/* Dynamic Content Body */}
            <div className="mb-6">{renderModalContent()}</div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingAction(null);
                  setOtpInput("");
                  setWarningForm({ subject: "", message: "" });
                }}
                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={loadingAction}
                className={`px-6 py-2 rounded-lg text-white font-bold shadow-lg shadow-gray-200 transition-all active:scale-95 flex items-center gap-2
                  ${
                    pendingAction?.danger
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                  ${loadingAction ? "opacity-70 cursor-not-allowed" : ""}
                `}
              >
                {loadingAction ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon, label, value, isMono }) => (
  <div className="flex items-center gap-3 py-1">
    <div className="text-gray-400">{icon}</div>
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`text-gray-700 font-medium ${
          isMono ? "font-mono text-sm" : ""
        }`}
      >
        {value}
      </span>
    </div>
  </div>
);

const Badge = ({ status, role }) => {
  if (status) {
    const styles =
      status === "active"
        ? "bg-green-100 text-green-700 border-green-200"
        : status === "banned"
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-gray-100 text-gray-700 border-gray-200";
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${styles}`}
      >
        {status}
      </span>
    );
  }
  if (role) {
    const styles =
      role === "admin"
        ? "bg-purple-100 text-purple-700 border-purple-200"
        : "bg-blue-50 text-blue-700 border-blue-200";
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${styles}`}
      >
        {role}
      </span>
    );
  }
  return null;
};

const ActionCard = ({ icon, title, desc, onClick, danger }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-4 hover:shadow-md active:scale-[0.98] ${
      danger
        ? "bg-white border-gray-200 hover:border-red-300 hover:bg-red-50 group"
        : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 group"
    }`}
  >
    <div
      className={`p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors`}
    >
      {icon}
    </div>
    <div>
      <h4
        className={`font-bold text-sm ${
          danger
            ? "text-gray-800 group-hover:text-red-700"
            : "text-gray-800 group-hover:text-blue-700"
        }`}
      >
        {title}
      </h4>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const ShieldCheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-500"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default UserManagement;
