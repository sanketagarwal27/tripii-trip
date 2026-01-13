import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Award,
  ShieldCheck,
  Zap,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  History,
  TrendingUp,
  Clock,
} from "lucide-react";

import {
  searchUsers,
  awardRandomPoints,
  getRewardHistory,
} from "@/api/admin.js";

const AwardRandomPoints = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [xpPoints, setXpPoints] = useState(0);
  const [trustScore, setTrustScore] = useState(0);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [stats, setStats] = useState({
    totalXpGiven: 0,
    totalTrustGiven: 0,
    totalActions: 0,
  });
  const [loadingHistory, setLoadingHistory] = useState(true);

  const wrapperRef = useRef(null);

  // --- Fetch History & Stats ---
  const fetchHistory = async () => {
    try {
      const response = await getRewardHistory();
      if (response.success) {
        setHistoryLogs(response.data.history);
        setStats(response.data.overview);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // --- Search Effect (Existing) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const results = await searchUsers(searchQuery);
          setSearchResults(results.data);
          setShowDropdown(true);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.username);
    setShowDropdown(false);
    setFeedback({ type: "", message: "" });
    setXpPoints(0);
    setTrustScore(0);
  };

  const handleAward = async () => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      const response = await awardRandomPoints(
        selectedUser._id,
        xpPoints,
        trustScore
      );
      if (!response.success) throw new Error("Awarding points failed");

      setFeedback({
        type: "success",
        message: `Awarded ${xpPoints} XP and ${trustScore} Trust to ${selectedUser.username}!`,
      });

      // Update Local User State
      setSelectedUser((prev) => ({
        ...prev,
        currentXp: prev.currentXp + Number(xpPoints),
        currentTrust: prev.currentTrust + Number(trustScore),
      }));

      // Reset Inputs
      setXpPoints(0);
      setTrustScore(0);

      // Refresh History to show the new log immediately
      fetchHistory();
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to update stats." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-6xl mx-auto min-h-screen bg-gray-50/50">
      {/* Header */}
      <h1 className="text-3xl font-bold text-teal-900 mb-8 flex items-center gap-3">
        <div className="p-2 bg-teal-100 rounded-lg">
          <Award className="text-teal-600" size={28} />
        </div>
        Award Points & Trust
      </h1>

      {/* --- 1. Overview Stats Section (New) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Zap}
          label="Total XP Awarded"
          value={stats.totalXpGiven}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
          borderColor="border-yellow-100"
        />
        <StatCard
          icon={ShieldCheck}
          label="Total Trust Awarded"
          value={stats.totalTrustGiven.toFixed(1)}
          color="text-teal-600"
          bgColor="bg-teal-50"
          borderColor="border-teal-100"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Actions"
          value={stats.totalActions}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
          borderColor="border-indigo-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- 2. Action Section (Left Column) --- */}
        <div className="lg:col-span-2 space-y-8">
          {/* Search Box */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100 relative z-20">
            <label className="block text-sm font-bold text-teal-800 mb-3">
              Find TripiiTrip User
            </label>
            <div ref={wrapperRef} className="relative">
              <div className="relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400 group-focus-within:text-teal-600 transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by username or name..."
                  className="w-full pl-12 pr-10 py-4 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all bg-gray-50 focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!selectedUser) setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.length > 1) setShowDropdown(true);
                  }}
                />
                {isSearching && (
                  <Loader2
                    className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-teal-500"
                    size={20}
                  />
                )}
              </div>

              {/* Dropdown Logic (Same as before but styled teal) */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute w-full bg-white mt-2 rounded-xl shadow-xl border border-teal-100 max-h-72 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="p-3 hover:bg-teal-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors"
                    >
                      <Avatar
                        src={user.avatar?.url}
                        alt={user.username}
                        size="w-10 h-10"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{user.username}
                        </p>
                      </div>
                      <div className="ml-auto text-xs text-gray-400 font-medium">
                        User Lvl {user.level || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback Message */}
            {feedback.message && (
              <div
                className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
                  feedback.type === "success"
                    ? "bg-teal-50 text-teal-700 border-teal-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                {feedback.message}
              </div>
            )}
          </div>

          {/* Allocation Panel */}
          {selectedUser && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start justify-between border-b border-gray-100 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={selectedUser.avatar?.url}
                    alt={selectedUser.username}
                    size="w-16 h-16"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedUser.fullName}
                    </h2>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded flex items-center gap-1">
                        <Zap size={12} /> {selectedUser.currentXp} XP
                      </span>
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded flex items-center gap-1">
                        <ShieldCheck size={12} /> {selectedUser.currentTrust}{" "}
                        Trust
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchQuery("");
                  }}
                  className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                <InputControl
                  label="XP Points"
                  value={xpPoints}
                  setValue={setXpPoints}
                  colorClass="focus:border-yellow-500 focus:ring-yellow-100"
                  quickOptions={[10, 50, 100]}
                  optionColor="text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                />
                <InputControl
                  label="Trust Score"
                  value={trustScore}
                  setValue={setTrustScore}
                  step="0.1"
                  colorClass="focus:border-teal-500 focus:ring-teal-100"
                  quickOptions={[0.5, 1.0, 5.0]}
                  optionColor="text-teal-700 bg-teal-50 hover:bg-teal-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAward}
                  disabled={
                    actionLoading || (xpPoints === 0 && trustScore === 0)
                  }
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-200 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Award size={18} />
                  )}
                  {actionLoading ? "Processing..." : "Confirm Reward"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- 3. History Section (Right Column / Sidebar) --- */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden h-fit sticky top-6">
            <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex justify-between items-center">
              <h3 className="font-bold text-teal-900 flex items-center gap-2">
                <History size={18} className="text-teal-600" /> Recent History
              </h3>
              <span className="text-xs font-medium text-teal-600 bg-white px-2 py-1 rounded-full border border-teal-100 shadow-sm">
                Last 20
              </span>
            </div>

            <div className="max-h-[600px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {loadingHistory ? (
                <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin" /> Loading logs...
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No rewards given yet.
                </div>
              ) : (
                historyLogs.map((log) => (
                  <HistoryItem key={log._id} log={log} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  borderColor,
}) => (
  <div
    className={`bg-white p-5 rounded-2xl border ${borderColor} shadow-sm flex items-center gap-4`}
  >
    <div
      className={`w-12 h-12 rounded-xl ${bgColor} ${color} flex items-center justify-center`}
    >
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const HistoryItem = ({ log }) => (
  <div className="p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 group">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <Avatar
          src={log.userId?.profilePicture?.url}
          alt={log.userId?.username}
          size="w-8 h-8"
        />
        <div className="leading-tight">
          <p className="text-sm font-bold text-gray-800">
            {log.userId?.username || "Unknown"}
          </p>
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            by {log.actorId?.username || "Admin"}
          </p>
        </div>
      </div>
      <div className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded flex items-center gap-1">
        <Clock size={10} /> {new Date(log.createdAt).toLocaleDateString()}
      </div>
    </div>

    <div className="flex gap-2 pl-10">
      {log.xp > 0 && (
        <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">
          +{log.xp} XP
        </span>
      )}
      {log.trust > 0 && (
        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
          +{log.trust} Trust
        </span>
      )}
    </div>
  </div>
);

const Avatar = ({ src, alt, size }) => (
  <div
    className={`${size} rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400 font-bold`}
  >
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    ) : (
      (alt?.[0] || "?").toUpperCase()
    )}
  </div>
);

const InputControl = ({
  label,
  value,
  setValue,
  colorClass,
  quickOptions,
  optionColor,
  step = 1,
}) => (
  <div>
    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
      {label}
    </label>
    <div className="relative">
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className={`w-full p-3 pl-4 rounded-xl border border-gray-200 outline-none font-mono text-lg transition-all ${colorClass}`}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        {quickOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setValue((prev) => Number((prev + opt).toFixed(1)))}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${optionColor}`}
          >
            +{opt}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default AwardRandomPoints;
