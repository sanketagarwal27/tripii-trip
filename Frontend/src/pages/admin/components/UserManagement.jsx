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

const UserManagement = () => {
  // --- States ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userStats, setUserStats] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Action State
  const [pendingAction, setPendingAction] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Form Inputs for Modal
  const [otpInput, setOtpInput] = useState("");
  const [warningForm, setWarningForm] = useState({ subject: "", message: "" });

  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // --- Search Logic ---

  useEffect(() => {
    const getStats = async () => {
      const stats = await getUserStats();
      setUserStats(stats.data);
    };
    getStats();
  }, []);

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
      month: "short",
      day: "numeric",
    });
  };

  // --- Action Triggers ---
  const triggerSimpleAction = (actionType, label, danger = false) => {
    setPendingAction({ type: actionType, label, danger });
    setShowConfirmModal(true);
  };

  const triggerWarningAction = () => {
    setPendingAction({
      type: "WARN",
      label: "Send Warning Email",
      danger: false,
    });
    setWarningForm({ subject: "Official Warning", message: "" });
    setShowConfirmModal(true);
  };

  const triggerSecureAction = async (actionType, label, danger = false) => {
    if (!selectedUser) return;
    setLoadingAction(true);
    try {
      await sendOtp(selectedUser._id);
      setPendingAction({ type: actionType, label, danger, requiresOtp: true });
      setOtpInput("");
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
        case "PROMOTE":
          if (!otpInput) throw new Error("OTP is required");
          response = await promoteUserToAdmin(userId, otpInput);
          setSelectedUser((prev) => ({ ...prev, role: "admin" }));
          break;

        case "DELETE":
          if (!otpInput) throw new Error("OTP is required");
          response = await permanentDeleteUser(userId, otpInput);
          setSelectedUser(null);
          break;

        case "BAN":
        case "UNBAN":
          response = await toggleUserBan(userId);
          setSelectedUser((prev) => ({
            ...prev,
            accountStatus:
              prev.accountStatus === "banned" ? "active" : "banned",
          }));
          break;

        case "WARN":
          if (!warningForm.message) throw new Error("Message is required");
          await sendWarning(userId, warningForm.subject, warningForm.message);
          break;

        case "VERIFY":
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

  // --- Render Modal Content ---
  const renderModalContent = () => {
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>
      );
    }

    if (pendingAction?.requiresOtp) {
      return (
        <div className="space-y-4">
          <div className="bg-teal-50 p-3 rounded-lg flex items-start gap-3">
            <KeyRound className="text-teal-600 mt-1" size={18} />
            <p className="text-sm text-teal-800">
              An OTP has been sent to your admin email. Please enter it below.
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-center text-2xl tracking-widest font-mono"
            />
          </div>
        </div>
      );
    }

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
    <div className="p-6 relative min-h-screen bg-slate-50/50">
      {/* Decorative Background Blob */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-teal-50 to-transparent -z-10" />

      {/* --- Feedback Alert --- */}
      {feedback.message && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium animate-in slide-in-from-right border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-700 border-red-100"
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
            className="ml-auto hover:opacity-70"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center gap-2">
            <LayoutGrid className="text-teal-600" /> User Management
          </h2>
          <p className="text-gray-500 mt-1">
            Manage accounts, security roles, and user discipline.
          </p>
        </div>
        {/* Placeholder Stats (Optional visual consistency) */}
        {!selectedUser && (
          <div className="flex gap-4 hidden lg:flex">
            <StatMini
              icon={User}
              label="Total Users"
              value={userStats.totalUsers}
            />
            <StatMini
              icon={UserPlus}
              label="New Today"
              value={`+${userStats.newUsersToday}`}
            />
            <StatMini
              icon={ShieldAlert}
              label="Banned"
              value={userStats.bannedUsers}
            />
          </div>
        )}
      </div>

      {/* --- Search Area (Visible only when no user selected) --- */}
      {!selectedUser && (
        <>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center ring-1 ring-gray-100">
            <div className="relative w-full max-w-2xl group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by username, email or full name..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all outline-none text-gray-700 placeholder-gray-400 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2
                  className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-teal-500"
                  size={20}
                />
              )}
            </div>
          </div>

          {/* Search Results Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden min-h-[400px]">
            {searchResults.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-teal-50/50 border-b border-teal-100">
                  <tr>
                    <th className="p-5 text-xs font-bold text-teal-900 uppercase tracking-wider">
                      User Profile
                    </th>
                    <th className="p-5 text-xs font-bold text-teal-900 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="p-5 text-xs font-bold text-teal-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="p-5 text-xs font-bold text-teal-900 uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {searchResults.map((user) => (
                    <tr
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="hover:bg-teal-50/30 transition-colors duration-200 cursor-pointer group"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-600 flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
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
                            <h3 className="font-semibold text-gray-800 group-hover:text-teal-700 transition-colors">
                              {user.fullName || "Unknown Name"}
                            </h3>
                            <p className="text-sm text-gray-500">
                              @{user.username} • {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <Badge role={user.role} />
                      </td>
                      <td className="p-5">
                        <Badge status={user.accountStatus} />
                      </td>
                      <td className="p-5 text-right">
                        <span className="text-teal-600 font-medium text-sm hover:underline">
                          Manage
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Search size={48} className="mb-4 opacity-20" />
                <p>Start searching to find users...</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- Selected User Dashboard --- */}
      {selectedUser && (
        <div className="animate-in zoom-in-95 duration-300">
          <button
            onClick={clearSelection}
            className="mb-6 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-teal-600 flex items-center gap-2 transition-all shadow-sm"
          >
            <ArrowLeft size={16} /> Back to Search
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-teal-50 to-cyan-50 -z-0" />

                <div className="w-32 h-32 bg-white rounded-full mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative z-10">
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

                <h2 className="text-2xl font-bold text-gray-900 z-10">
                  {selectedUser.fullName || selectedUser.username}
                </h2>
                <p className="text-gray-500 mb-6 z-10">
                  @{selectedUser.username}
                </p>

                <div className="flex gap-2 mb-8 z-10">
                  <Badge status={selectedUser.accountStatus} />
                  <Badge role={selectedUser.role} />
                </div>

                <div className="w-full border-t border-gray-100 pt-6 space-y-4 text-left z-10">
                  <InfoRow
                    icon={<Mail size={18} />}
                    label="Email"
                    value={selectedUser.email}
                  />
                  <InfoRow
                    icon={<Calendar size={18} />}
                    label="Joined"
                    value={formatDate(selectedUser.createdAt)}
                  />
                  <InfoRow
                    icon={<Shield size={18} />}
                    label="User ID"
                    value={selectedUser._id}
                    isMono
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Management Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* 🔒 SECURITY CHECK */}
              {selectedUser.role === "admin" ? (
                <div className="h-full min-h-[400px] bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Shield size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Admin Access Protected
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                    You are viewing an Administrator account. <br />
                    To prevent accidental lockouts,{" "}
                    <span className="font-semibold text-gray-700">
                      no actions can be performed
                    </span>{" "}
                    from this panel.
                  </p>
                </div>
              ) : (
                <>
                  {/* Access Control */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <UserCheck className="text-teal-600" /> Access Control
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
                          icon={<BadgeCheck className="text-blue-600" />}
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
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-amber-500" /> Account
                      Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.accountStatus !== "banned" ? (
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
                          icon={<CheckCircle className="text-emerald-600" />}
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
                  <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
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
                        className="bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-3 shadow-sm"
                      >
                        <Trash2 size={20} /> Delete Account Permanently
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 transform scale-100 animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${
                    pendingAction?.danger
                      ? "bg-red-50 text-red-600"
                      : "bg-teal-50 text-teal-600"
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
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Dynamic Content Body */}
            <div className="mb-6">{renderModalContent()}</div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingAction(null);
                  setOtpInput("");
                  setWarningForm({ subject: "", message: "" });
                }}
                className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={loadingAction}
                className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2
                  ${
                    pendingAction?.danger
                      ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                      : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:scale-[1.02] shadow-teal-200"
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

// --- Helper Components ---

const StatMini = ({ icon: Icon, label, value }) => (
  <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
    <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
      <Icon size={16} />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-bold text-gray-700">{value}</p>
    </div>
  </div>
);

const InfoRow = ({ icon, label, value, isMono }) => (
  <div className="flex items-center gap-4 py-2 border-b border-dashed border-gray-100 last:border-0">
    <div className="text-gray-400 bg-gray-50 p-2 rounded-lg">{icon}</div>
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
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : status === "banned"
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-gray-100 text-gray-700 border-gray-200";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold border capitalize shadow-sm ${styles}`}
      >
        {status}
      </span>
    );
  }
  if (role) {
    const styles =
      role === "admin"
        ? "bg-purple-100 text-purple-700 border-purple-200"
        : "bg-cyan-50 text-cyan-700 border-cyan-200";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold border capitalize shadow-sm ${styles}`}
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
    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 hover:shadow-md active:scale-[0.98] group ${
      danger
        ? "bg-white border-gray-100 hover:border-red-200 hover:bg-red-50/50"
        : "bg-white border-gray-100 hover:border-teal-200 hover:bg-teal-50/50"
    }`}
  >
    <div
      className={`p-2 rounded-lg transition-colors ${
        danger
          ? "bg-red-50 group-hover:bg-red-100"
          : "bg-gray-50 group-hover:bg-white shadow-sm"
      }`}
    >
      {icon}
    </div>
    <div>
      <h4
        className={`font-bold text-sm ${
          danger
            ? "text-gray-800 group-hover:text-red-700"
            : "text-gray-800 group-hover:text-teal-700"
        }`}
      >
        {title}
      </h4>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default UserManagement;
