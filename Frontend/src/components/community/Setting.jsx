import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Camera,
  Search,
  X,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Trash2,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateCommunitySettings,
  changeMemberRole,
  removeMember,
} from "@/api/community";
import {
  removeMemberFromCommunity,
  setCommunityProfile,
  updateMemberRole,
} from "@/redux/communitySlice";
import { socket } from "../../../Socket.js";

const roleBadge = {
  admin: {
    label: "Admin",
    icon: "👑",
    className:
      "bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-white shadow-[0_0_10px_rgba(234,179,8,0.6)] border border-yellow-300/50",
  },

  moderator: {
    label: "Moderator",
    icon: "🛡️",
    className:
      "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm border border-white/20",
  },

  member: {
    label: "Member",
    icon: "🙎‍♂️",
    className:
      "bg-gradient-to-r from-slate-500 to-slate-700 text-white border border-white/10",
  },
};

const CommSetting = () => {
  const dispatch = useDispatch();
  const members = useSelector((s) => s.community.profile.members);

  const communityProfile = useSelector((s) => s.community.profile);
  const currentUser = useSelector((s) => s.auth.user);
  const communityId = communityProfile._id;
  console.log("CommunityProfile:", communityProfile);

  // General Settings State
  const [communityName, setCommunityName] = useState("");
  const [communityRules, setCommunityRules] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [allowMemberRooms, setAllowMemberRooms] = useState(true);
  const [allowAddMembers, setAllowAddMembers] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // UI State
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);
  const [roleMessage, setRoleMessage] = useState(null);
  const [pendingRoleChanges, setPendingRoleChanges] = useState({});
  const [initialRules, setInitialRules] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [initialDescription, setInitialDescription] = useState("");

  const membersPerPage = 20;

  const filteredMembers = useMemo(() => {
    if (!Array.isArray(members)) return [];

    return members.filter((m) =>
      (m.displayName || m.user?.username || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [members, searchQuery]);

  // Initialize state from community profile
  useEffect(() => {
    if (!communityProfile) return;

    setCommunityName(communityProfile.name || "");

    if (Array.isArray(communityProfile.rules)) {
      const formatted = communityProfile.rules
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((r) => `${r.title}::${r.description}`)
        .join("\n");

      setCommunityRules(formatted);
      setInitialRules(formatted); // ✅ ADD THIS
    } else {
      setCommunityRules("");
    }

    setCoverPreview(communityProfile.backgroundImage?.url || "");

    setAllowMemberRooms(communityProfile.settings?.allowMemberRooms ?? true);

    setAllowAddMembers(communityProfile.settings?.allowMembersToAdd ?? false);

    setCommunityDescription(communityProfile.description || "");
    setInitialDescription(communityProfile.description || "");
  }, [communityProfile]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Socket listeners for real-time updates
  useEffect(() => {
    const handleCommunityUpdate = (data) => {
      if (data?.communityId === communityId) {
        // Update local state with new data
        if (data.name) setCommunityName(data.name);
        if (data.rules)
          setCommunityRules(
            Array.isArray(data.rules) ? data.rules.join("\n") : "",
          );
        if (data.backgroundImage) setCoverPreview(data.backgroundImage);
        if (data.settings) {
          setAllowMemberRooms((prev) => data.settings.allowMemberRooms ?? prev);
          setAllowAddMembers((prev) => data.settings.allowMembersToAdd ?? prev);
        }
      }
    };

    socket.on("community:updated", handleCommunityUpdate);

    return () => {
      socket.off("community:updated", handleCommunityUpdate);
    };
  }, [
    communityId,
    currentPage,
    searchQuery,
    allowMemberRooms,
    allowAddMembers,
  ]);

  // Handle cover image upload
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setSettingsMessage({
          type: "error",
          text: "Please select an image file",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSettingsMessage({
          type: "error",
          text: "Image must be less than 5MB",
        });
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save general settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsMessage(null);

    try {
      const formData = new FormData();
      if (isAdmin) {
        formData.append("name", communityName.trim());
      }

      const descriptionChanged =
        communityDescription.trim() !== initialDescription.trim();

      if (isAdmin && descriptionChanged) {
        formData.append("description", communityDescription.trim());
      }

      const rulesChanged = communityRules.trim() !== initialRules.trim();

      const rulesArray = communityRules
        .split("\n")
        .map((line, index) => {
          const [title, ...descParts] = line.split("::");
          const description = descParts.join("::");

          if (!title || !description) return null;

          return {
            title: title.trim(),
            description: description.trim(),
            order: index,
          };
        })
        .filter(Boolean);

      if (isAdmin && rulesChanged) {
        formData.append("rules", JSON.stringify(rulesArray));
      }

      formData.append(
        "settings",
        JSON.stringify({
          allowMemberRooms,
          allowMembersToAdd: allowAddMembers,
        }),
      );

      if (coverImage) {
        formData.append("coverImage", coverImage);
      }

      const response = await updateCommunitySettings(communityId, formData);

      if (response.data?.success) {
        const updatedCommunity = response.data.data;
        dispatch(setCommunityProfile(updatedCommunity));

        setSettingsMessage({
          type: "success",
          text: "Settings saved successfully!",
        });
        setCoverImage(null);

        setTimeout(() => setSettingsMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setSettingsMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save settings. Please try again.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle role change in UI
  const handleRoleChange = (userId, newRole) => {
    setPendingRoleChanges((prev) => ({
      ...prev,
      [userId]: newRole,
    }));
  };

  // Save role changes
  const handleSaveRoleChanges = async () => {
    if (Object.keys(pendingRoleChanges)?.length === 0) {
      setRoleMessage({ type: "error", text: "No role changes to save" });
      setTimeout(() => setRoleMessage(null), 3000);
      return;
    }

    setIsSavingRole(true);
    setRoleMessage(null);

    try {
      const changePromises = Object.entries(pendingRoleChanges).map(
        ([userId, role]) => changeMemberRole(communityId, userId, role),
      );

      await Promise.allSettled(changePromises);

      Object.entries(pendingRoleChanges).forEach(([userId, role]) => {
        dispatch(updateMemberRole({ userId, role }));
      });

      const changeCount = Object.keys(pendingRoleChanges)?.length;
      setPendingRoleChanges({});
      setRoleMessage({
        type: "success",
        text: `${changeCount} role${
          changeCount > 1 ? "s" : ""
        } updated successfully!`,
      });

      setTimeout(() => setRoleMessage(null), 3000);
    } catch (error) {
      console.error("Error updating roles:", error);
      setRoleMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to update roles. Please try again.",
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to remove ${username}?`)) return;

    try {
      const response = await removeMember(communityId, userId);

      if (response.data?.success) {
        // Remove from pending changes if exists
        setPendingRoleChanges((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });

        dispatch(
          setCommunityProfile({
            ...communityProfile,
            memberCount: communityProfile.memberCount - 1,
          }),
        );
        dispatch(removeMemberFromCommunity(userId));

        setRoleMessage({
          type: "success",
          text: `${username} removed successfully`,
        });
        setTimeout(() => setRoleMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error removing member:", error);
      setRoleMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to remove member",
      });
    }
  };

  const totalMembers = filteredMembers?.length;
  const totalPages = Math.ceil(totalMembers / membersPerPage);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * membersPerPage;
    return filteredMembers.slice(start, start + membersPerPage);
  }, [filteredMembers, currentPage]);

  const hasUnsavedRoleChanges = Object.keys(pendingRoleChanges)?.length > 0;

  // Check if current user is admin
  const isAdmin = communityProfile?.currentUserRole === "admin";

  //Sort members in order Admin->Moderator->Alphabetical(member and moderator)

  const sortedMembers = useMemo(() => {
    const rolePriority = { admin: 0, moderator: 1, member: 2 };

    return [...paginatedMembers].sort((a, b) => {
      const roleDiff = rolePriority[a.role] - rolePriority[b.role];
      if (roleDiff !== 0) return roleDiff;

      const nameA = (a.displayName || a.user.username).toLowerCase();
      const nameB = (b.displayName || b.user.username).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [paginatedMembers]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Community Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your community's appearance and permissions
          </p>
        </div>

        {/* General Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              General Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Update community identity, rules, and permissions
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Cover Photo */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Cover Photo
              </label>
              <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${
                      coverPreview ||
                      "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800"
                    })`,
                  }}
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <label className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/95 hover:bg-white text-gray-900 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-lg cursor-pointer transition-all">
                  <Camera className="w-4 h-4" />
                  Change Cover
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Community Name */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Community Name
              </label>
              <input
                type="text"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg transition-all
    ${
      !isAdmin
        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
        : "border-gray-300 focus:ring-2 focus:ring-blue-500"
    }
  `}
                placeholder="Enter community name"
              />
              {!isAdmin && (
                <p className="text-xs text-gray-500">
                  Only admins can change the community name
                </p>
              )}
            </div>

            {/* Community Description */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Community Description
              </label>

              <textarea
                value={communityDescription}
                onChange={(e) => setCommunityDescription(e.target.value)}
                rows={4}
                disabled={!isAdmin}
                placeholder="Describe what this community is about..."
                className={`w-full px-4 py-2.5 border rounded-lg transition-all
      ${
        !isAdmin
          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
          : "border-gray-300 focus:ring-2 focus:ring-blue-500"
      }
    `}
              />

              {!isAdmin && (
                <p className="text-xs text-gray-500">
                  Only admins can change the community description
                </p>
              )}
            </div>

            {/* Community Rules */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Community Rules
              </label>
              <textarea
                value={communityRules}
                onChange={(e) => setCommunityRules(e.target.value)}
                rows={8}
                className={`w-full px-4 py-2.5 border rounded-lg transition-all
    ${
      !isAdmin
        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
        : "border-gray-300 focus:ring-2 focus:ring-blue-500"
    }
  `}
              />
              {!isAdmin && (
                <p className="text-xs text-gray-500">
                  Only admins can change the community rules
                </p>
              )}
            </div>

            {/* Permissions */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                Permissions
              </h3>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Create Rooms
                  </p>
                  <p className="text-xs text-gray-600">
                    Allow members to create new public or private rooms
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMemberRooms}
                    onChange={(e) => setAllowMemberRooms(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Add Members
                  </p>
                  <p className="text-xs text-gray-600">
                    Allow members to invite friends directly
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAddMembers}
                    onChange={(e) => setAllowAddMembers(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Settings Message */}
            {settingsMessage && (
              <div
                className={`flex items-center gap-2 p-4 rounded-lg ${
                  settingsMessage.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {settingsMessage.type === "success" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {settingsMessage.text}
                </span>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Member Management Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Manage Members
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {totalMembers.toLocaleString()} total members
                  {hasUnsavedRoleChanges &&
                    ` • ${
                      Object.keys(pendingRoleChanges)?.length
                    } unsaved change(s)`}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full lg:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members..."
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Role Message */}
          {roleMessage && (
            <div
              className={`mx-6 mt-4 flex items-center gap-2 p-4 rounded-lg ${
                roleMessage.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {roleMessage.type === "success" ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{roleMessage.text}</span>
            </div>
          )}

          {/* Members List */}
          <div className="divide-y divide-gray-200">
            {isLoadingMembers ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : members?.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600">No members found</p>
              </div>
            ) : (
              sortedMembers.map((membership) => {
                const user = membership.user;
                const userId = user._id;
                const isCurrentUser = userId === currentUser?._id;
                const memberRole =
                  pendingRoleChanges[userId] || membership.role;

                return (
                  <div
                    key={membership._id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={
                          user?.profilePicture?.url ||
                          `https://ui-avatars.com/api/?name=${membership.displayName}&background=random`
                        }
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {membership.displayName || user.username}
                          {isCurrentUser && (
                            <span className="text-blue-600"> (You)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          @{user.username}
                        </p>
                      </div>
                      <span
                        className={`ml-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                          roleBadge[membership.role].className
                        }`}
                      >
                        <span>{roleBadge[membership.role].icon}</span>
                        {roleBadge[membership.role].label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <select
                        value={memberRole}
                        onChange={(e) =>
                          handleRoleChange(userId, e.target.value)
                        }
                        disabled={!isAdmin || isCurrentUser}
                        className={`bg-white border text-sm rounded-lg px-3 py-2
    ${
      !isAdmin
        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
        : "border-gray-300 focus:ring-2 focus:ring-blue-500"
    }
    ${pendingRoleChanges[userId] ? "ring-2 ring-blue-500" : ""}
  `}
                      >
                        <option value="admin" disabled={!isAdmin}>
                          Admin
                        </option>
                        <option value="moderator">Moderator</option>
                        <option value="member">Member</option>
                      </select>

                      {isAdmin &&
                        !isCurrentUser &&
                        membership.role !== "admin" && (
                          <button
                            onClick={() =>
                              handleRemoveMember(userId, user.username)
                            }
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !isLoadingMembers && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * membersPerPage + 1} to{" "}
                {Math.min(currentPage * membersPerPage, totalMembers)} of{" "}
                {totalMembers}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Save Role Changes Button */}
          {hasUnsavedRoleChanges && isAdmin && (
            <div className="p-4 border-t border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900">
                  You have {Object.keys(pendingRoleChanges)?.length} unsaved
                  role change(s)
                </p>
                <button
                  onClick={handleSaveRoleChanges}
                  disabled={isSavingRole}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  {isSavingRole ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Role Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommSetting;
