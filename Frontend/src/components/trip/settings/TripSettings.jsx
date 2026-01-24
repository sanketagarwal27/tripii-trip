import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Settings,
  Upload,
  Crown,
  UserPlus,
  UserMinus,
  LogOut,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  Globe,
  UserCog,
  Search,
} from "lucide-react";
import {
  getTripCapabilities,
  updateTripVisibility,
  addTripMember,
  removeTripMember,
  leaveTrip,
  assignTripRole,
  removeTripRole,
  updateTripCover,
} from "@/api/tripSetting";
import {
  updateTripField,
  updateTrip,
  removeTripParticipant,
  updateParticipantStatus,
  addTripRole as addTripRoleAction,
  removeTripRole as removeTripRoleAction,
  removeUserRoles,
} from "@/redux/tripSlice";
import api from "@/api/axios";

const TripSettings = ({ tripId, onClose }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const trip = useSelector((state) => state.trip.trips.byId[tripId]);
  const tripRoles = useSelector((state) => state.trip.tripRoles[tripId] || []);
  const userProfile = useSelector((s) => s.auth.userProfile);

  console.log("TripRoles in settings:", tripRoles);

  // UI State
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal States
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showManageRolesModal, setShowManageRolesModal] = useState(false);

  // User Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Form States
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [visibility, setVisibility] = useState("private");

  // Get active participants
  const activeParticipants = useMemo(
    () => trip?.participants?.filter((p) => p.status === "active") || [],
    [trip],
  );

  // Get member IDs set
  const memberIds = useMemo(
    () =>
      new Set(
        activeParticipants.map((p) => {
          const userId = p.user?._id || p.user;
          return userId?.toString();
        }),
      ),
    [activeParticipants],
  );

  // Get follower and following IDs
  const followerIds = useMemo(
    () => new Set((userProfile?.followers || []).map((u) => u._id)),
    [userProfile?.followers],
  );

  const followingIds = useMemo(
    () => new Set((userProfile?.following || []).map((u) => u._id)),
    [userProfile?.following],
  );

  // Build invite candidates (similar to community modal)
  const inviteCandidates = useMemo(() => {
    if (!userProfile) return [];

    const map = new Map();
    const followers = userProfile.followers || [];
    const following = userProfile.following || [];

    [...followers, ...following].forEach((u) => {
      if (!u?._id) return;

      const isFollower = followerIds.has(u._id);
      const isFollowing = followingIds.has(u._id);

      map.set(u._id, {
        ...u,
        relation:
          isFollower && isFollowing
            ? "both"
            : isFollowing
              ? "following"
              : "follower",
        isMember: memberIds.has(u._id),
      });
    });

    return Array.from(map.values());
  }, [userProfile, followerIds, followingIds, memberIds]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return inviteCandidates;

    return inviteCandidates.filter((u) =>
      u.username?.toLowerCase().includes(q),
    );
  }, [inviteCandidates, searchQuery]);

  // Group filtered users by relation
  const groupedUsers = useMemo(() => {
    const groups = {
      both: [],
      following: [],
      follower: [],
    };

    filteredUsers.forEach((u) => {
      if (u.relation === "both") groups.both.push(u);
      else if (u.relation === "following") groups.following.push(u);
      else groups.follower.push(u);
    });

    return groups;
  }, [filteredUsers]);

  // Fetch capabilities on mount
  useEffect(() => {
    fetchCapabilities();
  }, [tripId]);

  // Sync visibility from trip
  useEffect(() => {
    if (trip) {
      setVisibility(trip.visibility || "private");
    }
  }, [trip?.visibility]);

  const fetchCapabilities = async () => {
    try {
      setLoading(true);
      const response = await getTripCapabilities(tripId);
      setCapabilities(response.data.data.capabilities);
    } catch (err) {
      console.error("Capabilities error:", err);
      setError(err.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    try {
      setUploadingCover(true);
      setError(null);

      const response = await updateTripCover(tripId, file);

      dispatch(
        updateTripField({
          tripId,
          field: "coverPhoto",
          value: response.data.data,
        }),
      );

      setSuccess("Cover photo updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Cover upload error:", err);
      setError(err.response?.data?.message || "Failed to upload cover");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleVisibilityToggle = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const newVisibility = visibility === "private" ? "public" : "private";

      await updateTripVisibility(tripId, newVisibility);

      dispatch(
        updateTripField({
          tripId,
          field: "visibility",
          value: newVisibility,
        }),
      );

      setVisibility(newVisibility);
      setSuccess(`Trip is now ${newVisibility}`);
      setTimeout(() => setSuccess(null), 3000);
      setShowVisibilityModal(false);
    } catch (err) {
      console.error("Visibility error:", err);
      setError(err.response?.data?.message || "Failed to update visibility");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      setError("Please select at least one user");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      // Add members one by one
      for (const userId of selectedUsers) {
        await addTripMember(tripId, userId);
      }

      // Fetch updated trip
      const response = await api.get(`/api/trip/trips/${tripId}`, {
        withCredentials: true,
      });

      dispatch(updateTrip(response.data.data));

      setSuccess(
        `${selectedUsers.length} member${selectedUsers.length > 1 ? "s" : ""} added successfully`,
      );
      setTimeout(() => setSuccess(null), 3000);
      setShowMemberModal(false);
      setSelectedUsers([]);
      setSearchQuery("");
    } catch (err) {
      console.error("Add members error:", err);
      setError(err.response?.data?.message || "Failed to add members");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await removeTripMember(tripId, memberId);

      dispatch(removeTripParticipant({ tripId, userId: memberId }));
      dispatch(removeUserRoles({ tripId, userId: memberId }));

      setSuccess("Member removed successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Remove member error:", err);
      setError(err.response?.data?.message || "Failed to remove member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedMember || !selectedRole) {
      setError("Please select member and role");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      // Check if role already exists for this user
      const existingRole = tripRoles.find(
        (role) =>
          role.roleName === selectedRole &&
          (role.assignedTo?._id || role.assignedTo)?.toString() ===
            selectedMember.toString() &&
          role.status === "active",
      );

      if (existingRole) {
        setError("This user already has this role assigned");
        setActionLoading(false);
        return;
      }

      const response = await assignTripRole(tripId, {
        roleName: selectedRole,
        assignedTo: selectedMember,
      });

      console.log("Assign role response:", response.data);

      dispatch(
        addTripRoleAction({
          tripId,
          role: response.data.data,
        }),
      );

      setSuccess("Role assigned successfully");
      setTimeout(() => setSuccess(null), 3000);
      setShowRoleModal(false);
      setSelectedMember(null);
      setSelectedRole("");
    } catch (err) {
      console.error("Assign role error:", err);
      const errorMsg = err.response?.data?.message || "Failed to assign role";

      if (errorMsg.includes("duplicate") || errorMsg.includes("E11000")) {
        setError("This user already has this role assigned");
      } else {
        setError(errorMsg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRole = async (roleId) => {
    if (!window.confirm("Remove this role?")) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await removeTripRole(tripId, roleId);

      dispatch(removeTripRoleAction({ tripId, roleId }));

      setSuccess("Role removed successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Remove role error:", err);
      setError(err.response?.data?.message || "Failed to remove role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTrip = async () => {
    if (
      !window.confirm(
        "Are you sure you want to leave this trip? You may not be able to rejoin.",
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await leaveTrip(tripId);

      dispatch(
        updateParticipantStatus({
          tripId,
          userId: currentUser._id,
          status: "left",
        }),
      );

      setSuccess("Left trip successfully");
      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (err) {
      console.error("Leave trip error:", err);
      setError(err.response?.data?.message || "Failed to leave trip");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId));
  };

  // Get user roles
  const getUserRoles = (userId) => {
    return tripRoles
      .filter((role) => {
        const assignedId = role.assignedTo?._id || role.assignedTo;
        return (
          assignedId?.toString() === userId?.toString() &&
          role.status === "active"
        );
      })
      .map((role) => role.roleName);
  };

  // Members with roles
  const membersWithRoles = useMemo(
    () =>
      activeParticipants.map((participant) => {
        const userId = participant.user?._id || participant.user;
        return {
          ...participant,
          roles: getUserRoles(userId),
        };
      }),
    [activeParticipants, tripRoles],
  );

  // Get available roles for a member
  const getAvailableRoles = (userId) => {
    const userRoles = getUserRoles(userId);
    return roles.filter((role) => !userRoles.includes(role));
  };

  const isAdmin = trip?.createdBy === currentUser?._id;

  const roles = [
    "Captain",
    "Cameraman",
    "Manager",
    "Cook",
    "Navigator",
    "Accountant",
    "Planner",
  ];

  // Section component for grouped users
  const UserSection = ({ title, users }) => {
    if (users.length === 0) return null;

    return (
      <div className="py-2">
        <p className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">
          {title}
        </p>
        {users.map((user) => {
          const isParticipant = user.isMember;
          const isSelected = selectedUsers.includes(user._id);

          return (
            <button
              key={user._id}
              onClick={() => !isParticipant && toggleUserSelection(user._id)}
              disabled={isParticipant}
              className={`w-full p-3 flex items-center justify-between ${
                isParticipant
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {user.profilePicture?.url ? (
                    <img
                      src={user.profilePicture.url}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {user.username?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {user.username}
                  </p>
                  {isParticipant && (
                    <p className="text-xs text-slate-500">Already a member</p>
                  )}
                </div>
              </div>

              {isParticipant ? (
                <span className="text-xs text-slate-400 font-semibold flex-shrink-0">
                  Member
                </span>
              ) : (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleUserSelection(user._id)}
                  className="w-4 h-4 accent-blue-600 flex-shrink-0"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!trip || !capabilities) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-slate-600">Trip settings not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Trip Settings
              </h1>
              <p className="text-sm text-slate-500 truncate max-w-[200px] sm:max-w-none">
                {trip.title}
              </p>
            </div>
          </div>
          <Settings className="w-6 h-6 text-slate-400" />
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1 break-words">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="flex-shrink-0">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-medium flex-1">{success}</p>
            <button onClick={() => setSuccess(null)} className="flex-shrink-0">
              <X className="w-4 h-4 text-green-400" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 pb-20">
        {/* Cover Photo */}
        {capabilities.canChangeCover && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Cover Photo</h2>
            </div>
            <div className="p-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100">
                {trip.coverPhoto?.url ? (
                  <img
                    src={trip.coverPhoto.url}
                    alt="Trip cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Upload className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 hover:bg-black/50 transition-colors cursor-pointer flex items-center justify-center group">
                  <div className="text-center">
                    {uploadingCover ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-white text-sm font-medium">
                          {trip.coverPhoto?.url
                            ? "Change Cover"
                            : "Upload Cover"}
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Max 5MB. Recommended: 1600x900px
              </p>
            </div>
          </div>
        )}

        {/* Visibility */}
        {capabilities.canChangeVisibility && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Visibility</h2>
            </div>
            <button
              onClick={() => setShowVisibilityModal(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors active:bg-slate-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                {visibility === "private" ? (
                  <Lock className="w-5 h-5 text-slate-600 flex-shrink-0" />
                ) : (
                  <Globe className="w-5 h-5 text-blue-600 flex-shrink-0" />
                )}
                <div className="text-left min-w-0">
                  <p className="font-medium text-slate-900 capitalize">
                    {visibility}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {visibility === "private"
                      ? "Only members can see"
                      : "Anyone can discover"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Members */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Members ({activeParticipants.length})
            </h2>
            {capabilities.canAddMembers && (
              <button
                onClick={() => setShowMemberModal(true)}
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors active:bg-blue-100"
              >
                <UserPlus className="w-5 h-5 text-blue-600" />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {membersWithRoles.map((participant) => {
              const userId = participant.user?._id || participant.user;
              const isOwner = userId === trip.createdBy;

              return (
                <div
                  key={userId}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {participant.user?.username?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">
                        {participant.user?.username || "User"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOwner && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <Crown className="w-3 h-3" />
                            <span>Admin</span>
                          </div>
                        )}
                        {participant.roles?.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {participant.roles.map((role, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isOwner && capabilities.canRemoveMembers && (
                    <button
                      onClick={() => handleRemoveMember(userId)}
                      disabled={actionLoading}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 active:bg-red-100 flex-shrink-0"
                    >
                      <UserMinus className="w-5 h-5 text-red-600" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Roles Management */}
        {capabilities.canAssignRoles && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-slate-900">Role Management</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowManageRolesModal(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium active:bg-slate-300 flex items-center gap-2"
                >
                  <UserCog className="w-4 h-4" />
                  View All
                </button>
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium active:bg-blue-800"
                >
                  Assign Role
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600">
                Assign special roles to trip members to help organize and manage
                activities.
              </p>
              {tripRoles.length > 0 && (
                <div className="mt-3 text-sm text-slate-500">
                  <span className="font-medium">
                    {tripRoles.filter((r) => r.status === "active").length}
                  </span>{" "}
                  active roles assigned
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leave Trip */}
        {capabilities.canLeaveTrip && (
          <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
            <button
              onClick={handleLeaveTrip}
              disabled={actionLoading}
              className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors disabled:opacity-50 active:bg-red-100"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <LogOut className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium text-red-600">Leave Trip</p>
                  <p className="text-sm text-slate-500 truncate">
                    You won't be able to rejoin
                  </p>
                </div>
              </div>
              {actionLoading && (
                <Loader2 className="w-5 h-5 animate-spin text-red-600 flex-shrink-0" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Visibility Modal */}
      {showVisibilityModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Change Visibility</h3>
              <button
                onClick={() => setShowVisibilityModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => setVisibility("private")}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  visibility === "private"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 active:border-slate-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-slate-900">Private</p>
                    <p className="text-sm text-slate-500">
                      Only members can see this trip
                    </p>
                  </div>
                  {visibility === "private" && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setVisibility("public")}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  visibility === "public"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 active:border-slate-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-slate-900">Public</p>
                    <p className="text-sm text-slate-500">
                      Anyone can discover this trip
                    </p>
                  </div>
                  {visibility === "public" && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              <button
                onClick={handleVisibilityToggle}
                disabled={actionLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 active:bg-blue-800"
              >
                {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-up flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold">Add Members</h3>
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setSelectedUsers([]);
                  setSearchQuery("");
                }}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search followers & following..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg mb-2">
                    <span className="text-sm font-medium text-blue-700">
                      {selectedUsers.length} selected
                    </span>
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedUsers.map((id) => {
                      const user = inviteCandidates.find((u) => u._id === id);
                      if (!user) return null;

                      return (
                        <div
                          key={id}
                          className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                        >
                          <span className="truncate max-w-[100px]">
                            {user.username}
                          </span>
                          <button onClick={() => removeSelectedUser(id)}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto -mx-6 px-6">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">
                      {searchQuery
                        ? "No users found"
                        : inviteCandidates.length === 0
                          ? "No followers or following yet"
                          : "Start typing to search"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <UserSection
                      title="Followers & Following"
                      users={groupedUsers.both}
                    />
                    <UserSection
                      title="Following"
                      users={groupedUsers.following}
                    />
                    <UserSection
                      title="Followers"
                      users={groupedUsers.follower}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleAddMembers}
                disabled={selectedUsers.length === 0 || actionLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 active:bg-blue-800 flex-shrink-0"
              >
                {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Add{" "}
                {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Assign Role</h3>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedMember(null);
                  setSelectedRole("");
                }}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Member
                </label>
                <select
                  value={selectedMember || ""}
                  onChange={(e) => {
                    setSelectedMember(e.target.value);
                    setSelectedRole("");
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                >
                  <option value="">Choose member...</option>
                  {activeParticipants.map((p) => {
                    const userId = p.user?._id || p.user;
                    return (
                      <option key={userId} value={userId}>
                        {p.user?.username || "User"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Role
                </label>
                {selectedMember ? (
                  <div className="grid grid-cols-2 gap-2">
                    {getAvailableRoles(selectedMember).length > 0 ? (
                      getAvailableRoles(selectedMember).map((role) => (
                        <button
                          key={role}
                          onClick={() => setSelectedRole(role)}
                          className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                            selectedRole === role
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-200 hover:border-slate-300 active:border-slate-400 text-slate-700"
                          }`}
                        >
                          {role}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4 text-sm text-slate-500">
                        This member already has all available roles
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-slate-500">
                    Select a member first
                  </div>
                )}
              </div>

              <button
                onClick={handleAssignRole}
                disabled={!selectedMember || !selectedRole || actionLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 active:bg-blue-800"
              >
                {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Assign Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage All Roles Modal */}
      {showManageRolesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Assigned Roles</h3>
              <button
                onClick={() => setShowManageRolesModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              {tripRoles.filter((r) => r.status === "active").length === 0 ? (
                <div className="text-center py-12">
                  <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No roles assigned yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Assign roles to help organize your trip
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tripRoles
                    .filter((r) => r.status === "active")
                    .map((role) => {
                      const assignedUser = activeParticipants.find((p) => {
                        const userId = p.user?._id || p.user;
                        const assignedId =
                          role.assignedTo?._id || role.assignedTo;
                        return userId?.toString() === assignedId?.toString();
                      });

                      return (
                        <div
                          key={role._id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {assignedUser?.user?.username?.[0]?.toUpperCase() ||
                                  "U"}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-900 truncate">
                                {assignedUser?.user?.username || "Unknown User"}
                              </p>
                              <p className="text-sm text-blue-600 font-medium">
                                {role.roleName}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveRole(role._id)}
                            disabled={actionLoading}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 active:bg-red-100 flex-shrink-0"
                          >
                            <X className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        @media (min-width: 640px) {
          .animate-slide-up {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TripSettings;
