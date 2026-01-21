// components/AddMembers.jsx
import { useState, useEffect, useMemo } from "react";
import { X, Search, UserPlus } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { searchUsers } from "@/api/users";
import { updateRoom } from "@/api/room";
import { setSelectedRoomData } from "@/redux/roomSlice";
import React from "react";

const AddMembers = ({ room, onClose }) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState("community");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const members = useSelector((s) => s.community.profile?.members || []);

  const existingMemberIds = useMemo(
    () =>
      room.members.map((m) =>
        typeof m.user === "string" ? m.user : m.user?._id,
      ),
    [room.members],
  );

  const communityMembers = members.filter((m) => {
    const uid = m.user?._id;
    return !existingMemberIds.includes(uid) && uid !== currentUser?._id;
  });

  /** --------------------------------
   * Following (excluding room members)
   -------------------------------- */
  const following =
    currentUser?.following?.filter(
      (u) => !existingMemberIds.includes(u?._id),
    ) || [];

  /** --------------------------------
   * Search users
   -------------------------------- */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchUsers(searchQuery, 1, 20);
        setSearchResults(
          (res.data.data || []).filter(
            (u) =>
              u?._id !== currentUser?._id &&
              !existingMemberIds.includes(u?._id),
          ),
        );
      } catch (err) {
        console.error(err);
      }
      setSearchLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, existingMemberIds, currentUser?._id]);

  /** --------------------------------
   * Toggle select
   -------------------------------- */
  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  /** --------------------------------
   * Submit
   -------------------------------- */
  const submit = async () => {
    if (!selectedMembers.length) return;

    setLoading(true);
    try {
      console.log("SelectedMemb:", selectedMembers);
      const res = await updateRoom(room?._id, {
        addMembers: selectedMembers,
      });
      console.log("res.data.data:", res.data.data);

      dispatch(setSelectedRoomData(res.data.data));
      onClose();
    } catch (err) {
      console.error("Failed to add members", err);
    } finally {
      setLoading(false);
    }
  };

  /** --------------------------------
   * Display list
   -------------------------------- */
  const displayList = searchQuery
    ? searchResults
    : activeTab === "following"
      ? following
      : communityMembers;

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {/* HEADER */}
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <UserPlus size={18} /> Add Members
            </h3>
            <button onClick={onClose}>
              <X size={22} />
            </button>
          </div>

          {/* TABS */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("community")}
              className={`flex-1 py-3 font-medium ${
                activeTab === "community"
                  ? "border-b-2 border-[#15f0db] text-[#15f0db]"
                  : "text-gray-600"
              }`}
            >
              Community
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 py-3 font-medium ${
                activeTab === "following"
                  ? "border-b-2 border-[#15f0db] text-[#15f0db]"
                  : "text-gray-600"
              }`}
            >
              Following
            </button>
          </div>

          {/* SEARCH */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#15f0db]"
              />
            </div>
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {searchLoading ? (
              <p className="text-center text-gray-500">Searching…</p>
            ) : displayList.length ? (
              displayList.map((user) => {
                const uid = user?.user?._id || user?._id;
                const u = user.user || user;
                const checked = selectedMembers.includes(uid);

                return (
                  <label
                    key={uid}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMember(uid)}
                      className="accent-[#15f0db]"
                    />
                    <img
                      src={u?.profilePicture?.url || "/travel.jpg"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm">{u.username}</p>
                    </div>
                  </label>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-6">
                No users available
              </p>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-4 border-t">
            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-[#15f0db] to-[#0ec9b5] text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50"
            >
              {loading
                ? "Adding..."
                : `Add ${selectedMembers.length} Member(s)`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddMembers;
