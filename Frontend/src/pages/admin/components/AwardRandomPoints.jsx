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
} from "lucide-react";

import { searchUsers, awardRandomPoints } from "@/api/admin.js";

const AwardRandomPoints = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const wrapperRef = useRef(null);

  // Form States
  const [xpPoints, setXpPoints] = useState(0);
  const [trustScore, setTrustScore] = useState(0);

  // --- 1. Search Effect ---
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

      setSelectedUser((prev) => ({
        ...prev,
        currentXp: prev.currentXp + Number(xpPoints),
        currentTrust: prev.currentTrust + Number(trustScore),
      }));
      setXpPoints(0);
      setTrustScore(0);
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to update stats." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-4xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Award className="text-blue-600" />
        Award Points & Trust
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 relative z-20">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Find User
        </label>

        <div ref={wrapperRef} className="relative">
          {/* Input Field */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Start typing username..."
              className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500"
                size={18}
              />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute w-full bg-white mt-2 rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto overflow-x-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar.url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.username[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {user.fullName || ""}
                    </p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Zap size={10} /> {user.currentXp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showDropdown &&
            searchQuery.length > 1 &&
            searchResults.length === 0 &&
            !isSearching && (
              <div className="absolute w-full bg-white mt-2 p-4 text-center text-gray-500 text-sm rounded-lg shadow-xl border border-gray-100 z-50">
                No users found matching "{searchQuery}"
              </div>
            )}
        </div>

        {feedback.message && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
              feedback.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            {feedback.message}
          </div>
        )}
      </div>

      {/* --- User Result & Action Section --- */}
      {selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* User Profile Card */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center h-fit sticky top-6">
            <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
              {selectedUser.avatar ? (
                <img
                  src={selectedUser.avatar.url}
                  alt={selectedUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-gray-400" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {selectedUser.fullName}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              @{selectedUser.username}
            </p>

            <div className="w-full space-y-3">
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex justify-between items-center">
                <span className="text-yellow-700 text-sm font-medium flex items-center gap-2">
                  <Zap size={16} /> Current XP
                </span>
                <span className="text-yellow-800 font-bold text-lg">
                  {selectedUser.currentXp}
                </span>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex justify-between items-center">
                <span className="text-green-700 text-sm font-medium flex items-center gap-2">
                  <ShieldCheck size={16} /> Trust Score
                </span>
                <span className="text-green-800 font-bold text-lg">
                  {selectedUser.currentTrust}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedUser(null);
                setSearchQuery("");
              }}
              className="mt-6 text-xs text-gray-400 hover:text-red-500 underline"
            >
              Clear Selection
            </button>
          </div>

          {/* Action Form */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-4">
              Allocate Rewards
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* XP Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Add XP
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={xpPoints}
                    onChange={(e) => setXpPoints(Number(e.target.value))}
                    className="w-full p-3 pl-4 rounded-lg border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 outline-none font-mono text-lg"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <QuickAddBtn
                      value={10}
                      onClick={() => setXpPoints((p) => p + 10)}
                      color="text-yellow-600 bg-yellow-50"
                    />
                    <QuickAddBtn
                      value={50}
                      onClick={() => setXpPoints((p) => p + 50)}
                      color="text-yellow-600 bg-yellow-50"
                    />
                  </div>
                </div>
              </div>

              {/* Trust Score Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Add Trust Score
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={trustScore}
                    onChange={(e) => setTrustScore(Number(e.target.value))}
                    className="w-full p-3 pl-4 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none font-mono text-lg"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <QuickAddBtn
                      value={0.5}
                      onClick={() => setTrustScore((p) => p + 0.5)}
                      color="text-green-600 bg-green-50"
                    />
                    <QuickAddBtn
                      value={1}
                      onClick={() => setTrustScore((p) => p + 1)}
                      color="text-green-600 bg-green-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-50">
              <button
                onClick={handleAward}
                disabled={actionLoading || (xpPoints === 0 && trustScore === 0)}
                className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-gray-200 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Processing..." : "Confirm & Award"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickAddBtn = ({ value, onClick, color }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2 py-1 rounded text-xs font-bold hover:brightness-95 transition-all ${color}`}
  >
    +{value}
  </button>
);

export default AwardRandomPoints;
