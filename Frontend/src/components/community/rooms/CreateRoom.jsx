import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  UserPlus,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { addRoom } from "@/redux/roomSlice";
import { setCommunityRooms } from "@/redux/communitySlice";
import { createRoom } from "@/api/room";
import { searchUsers } from "@/api/users";
import useCommunityProfile from "@/hooks/useCommunityProfile";

const TAGS = [
  "Adventure",
  "Backpacking",
  "Hiking",
  "Photography",
  "Food",
  "City",
  "State",
  "Friends",
  "Nature",
  "Sports",
  "Games",
  "Culture",
  "Tech",
  "Education",
  "Nightlife",
];

const CreateRoom = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const profile = useSelector((s) => s.community.profile);
  const rooms = useSelector((s) => s.community.rooms);
  const currentUser = useSelector((s) => s.auth.userProfile);
  const members = profile?.members || [];
  console.log("Profile:", profile);
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomtype, setRoomtype] = useState("Normal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [roomTags, setRoomTags] = useState([]);
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [tripType, setTripType] = useState("national");
  const [location, setLocation] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Overlay State
  const [showMemberOverlay, setShowMemberOverlay] = useState(false);
  const [activeTab, setActiveTab] = useState("community");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filter members (exclude current user)
  const communityMembers = members.filter(
    (m) => m.user._id !== currentUser?._id
  );

  // Use following instead of followers
  const following = currentUser?.following || [];

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchUsers(searchQuery, 1, 20);
        setSearchResults(res.data.data || []);
      } catch (err) {
        console.error("Search error:", err);
      }
      setSearchLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const formatDate = (year, month, day) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const handleDateClick = (dateStr) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate("");
    } else {
      if (new Date(dateStr) > new Date(startDate)) {
        setEndDate(dateStr);
      } else {
        setEndDate(startDate);
        setStartDate(dateStr);
      }
    }
  };

  const isDateInRange = (dateStr) => {
    if (!startDate) return false;
    const date = new Date(dateStr);
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    return date >= start && date <= end;
  };

  const isDateSelected = (dateStr) =>
    dateStr === startDate || dateStr === endDate;

  const toggleTag = (tag) => {
    setRoomTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setBackgroundImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Room name is required");
    if (!startDate || !endDate) return toast.error("Please select dates");
    if (!backgroundImage) return toast.error("Background image is required");
    if (roomtype === "Trip" && !location.trim())
      return toast.error("Location is required for trip rooms");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("roomtype", roomtype);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("isEphemeral", isEphemeral);
    formData.append("roomTags", JSON.stringify(roomTags));
    formData.append("initialMembers", JSON.stringify(selectedMembers));
    formData.append("backgroundImage", backgroundImage);

    if (roomtype === "Trip") {
      formData.append("tripType", tripType);
      formData.append("locationName", location);
    }

    setLoading(true);
    try {
      const response = await createRoom(communityId, formData);
      if (response.data.success) {
        toast.success("Room created successfully!");
        const newRoom = response.data.data.room;
        dispatch(addRoom(newRoom));
        dispatch(setCommunityRooms([newRoom, ...rooms]));
        navigate(`/community/${communityId}`);

        useCommunityProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create room");
    }
    setLoading(false);
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Get display list based on active tab and search
  const getDisplayList = () => {
    if (searchQuery.trim()) {
      return searchResults.filter((u) => u._id !== currentUser?._id);
    }
    if (activeTab === "following") {
      return currentUser?.following || [];
    }
    return communityMembers;
  };

  const displayList = getDisplayList();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-[#15f0db] mb-6 transition"
        >
          <ChevronLeft size={20} /> Back to Community
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            Create Your New {roomtype} Room in {profile.name}
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Fill in the details below to start planning your next adventure.
          </p>
        </div>

        <div className="space-y-6">
          {/* Room Type Selection */}
          <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Room Type</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  value: "Normal",
                  label: "Normal Room",
                  desc: "General discussion room",
                },
                {
                  value: "Trip",
                  label: "Trip Room",
                  desc: "Plan and organize a trip",
                },
              ].map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition ${
                    roomtype === type.value
                      ? "border-[#15f0db] bg-[#15f0db]/10"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    checked={roomtype === type.value}
                    onChange={() => setRoomtype(type.value)}
                  />
                  <div>
                    <span className="font-bold text-gray-900">
                      {type.label}
                    </span>
                    <p className="text-xs text-gray-600">{type.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Basic Details */}
          <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Basic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer in Santorini"
                  className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#15f0db] focus:outline-none"
                />
              </div>
              {roomtype === "Trip" && (
                <div>
                  <label className="block text-gray-900 font-medium mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Greece"
                    className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#15f0db] focus:outline-none"
                  />
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-gray-900 font-medium mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe your room..."
                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#15f0db] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Trip Type */}
          {roomtype === "Trip" && (
            <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Trip Type</h3>
              <div className="grid grid-cols-2 gap-4">
                {["national", "international"].map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
                      tripType === type
                        ? "border-[#15f0db] bg-[#15f0db]/10"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={tripType === type}
                      onChange={() => setTripType(type)}
                    />
                    <span className="font-medium text-gray-900 capitalize">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Select Dates</h3>
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1
                        )
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-bold text-gray-900">{monthName}</span>
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1
                        )
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div key={i} className="font-bold text-xs text-gray-600">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = formatDate(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      day
                    );
                    const inRange = isDateInRange(dateStr);
                    const selected = isDateSelected(dateStr);
                    return (
                      <button
                        key={day}
                        onClick={() => handleDateClick(dateStr)}
                        className={`h-10 w-10 rounded-full text-sm font-medium transition ${
                          selected
                            ? "bg-[#15f0db] text-white"
                            : inRange
                            ? "bg-[#15f0db]/20"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                {startDate && endDate && (
                  <div className="mt-4 text-center text-sm text-gray-600">
                    {new Date(startDate).toLocaleDateString()} -{" "}
                    {new Date(endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Background Image */}
          <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Background Image *</h3>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setBackgroundImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload size={32} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Room Tags */}
          <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Room Tags</h3>
            <p className="text-xs text-gray-600 mb-3">
              Add tags to help others find your room
            </p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    roomTags.includes(tag)
                      ? "bg-gradient-to-r from-[#15f0db] to-[#0ec9b5] text-white shadow-lg shadow-[#15f0db]/30"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Invite Members */}
          <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Invite Members</h3>
              <button
                onClick={() => setShowMemberOverlay(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#15f0db] to-[#0ec9b5] text-white rounded-lg hover:shadow-lg hover:shadow-[#15f0db]/30 transition-all"
              >
                <UserPlus size={18} />
                Add Members
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {selectedMembers.length} member(s) selected
            </p>
          </div>

          {/* Ephemeral Option */}
          <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isEphemeral}
                onChange={(e) => setIsEphemeral(e.target.checked)}
                className="accent-[#15f0db]"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Make this room ephemeral
                </span>
                <p className="text-xs text-gray-600">
                  Room will be automatically deleted after the end date
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-300">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 h-12 px-6 bg-gray-200 text-gray-900 rounded-lg font-bold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 h-12 px-6 bg-gradient-to-r from-[#15f0db] to-[#0ec9b5] text-white rounded-lg font-bold hover:shadow-lg hover:shadow-[#15f0db]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Room"}
            </button>
          </div>
        </div>
      </div>

      {/* Member Selection Overlay */}
      {showMemberOverlay && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowMemberOverlay(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-lg">Add Members</h3>
                <button
                  onClick={() => setShowMemberOverlay(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("community")}
                  className={`flex-1 py-3 font-medium transition ${
                    activeTab === "community"
                      ? "border-b-2 border-[#15f0db] text-[#15f0db]"
                      : "text-gray-600"
                  }`}
                >
                  Community Members ({communityMembers.length})
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className={`flex-1 py-3 font-medium transition ${
                    activeTab === "following"
                      ? "border-b-2 border-[#15f0db] text-[#15f0db]"
                      : "text-gray-600"
                  }`}
                >
                  My Following ({following.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${
                      activeTab === "community"
                        ? "community members"
                        : "following"
                    }...`}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15f0db] focus:outline-none"
                  />
                </div>
              </div>

              {/* Member List */}
              <div className="overflow-y-auto max-h-96 p-4">
                {searchLoading ? (
                  <p className="text-center text-gray-500">Searching...</p>
                ) : displayList.length > 0 ? (
                  <div className="space-y-2">
                    {displayList.map((item) => {
                      const user = item.user || item;
                      const userId = user._id || user.id;
                      const isSelected = selectedMembers.includes(userId);

                      return (
                        <label
                          key={userId}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(userId)}
                            className="accent-[#15f0db]"
                          />
                          <img
                            src={user.profilePicture?.url || "/travel.jpg"}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = "/travel.jpg";
                            }}
                          />
                          <div>
                            <p className="font-medium text-sm">
                              {item.displayName || user.username}
                            </p>
                            {item.role && (
                              <p className="text-xs text-gray-500">
                                {item.role}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    {activeTab === "following" && !searchQuery
                      ? "You're not following anyone yet"
                      : "No members found"}
                  </p>
                )}
              </div>

              <div className="p-4 border-t">
                <button
                  onClick={() => setShowMemberOverlay(false)}
                  className="w-full py-2 bg-gradient-to-r from-[#15f0db] to-[#0ec9b5] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#15f0db]/30 transition-all"
                >
                  Done ({selectedMembers.length} selected)
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CreateRoom;
