import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Tag } from "lucide-react";
import { formatDate, ROOM_STATUS_META } from "../common/roomStatus";
import { joinRoom } from "@/api/room";
import { toast } from "react-hot-toast";
import { updateCommunityRoom } from "@/redux/communitySlice";

const RoomsTab = ({ communityId }) => {
  const navigate = useNavigate();
  const rooms = useSelector((s) => s.community.rooms || []);
  const currentUser = useSelector((s) => s.auth?.user);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const dispatch = useDispatch();

  console.log("Rooms:", rooms);

  const handleJoinRoom = async (roomId, e) => {
    e.stopPropagation();

    if (joiningRoomId) return;

    setJoiningRoomId(roomId);
    try {
      await joinRoom(roomId);
      dispatch(
        updateCommunityRoom({
          _id: roomId,
          $addMember: {
            user: { _id: currentUser._id },
          },
        })
      );
      toast.success("Successfully joined the room!");
    } catch (error) {
      console.error("Failed to join room:", error);
      toast.error(error.response?.data?.message || "Failed to join room");
    } finally {
      setJoiningRoomId(null);
    }
  };

  const isUserMember = (room) => {
    if (!currentUser?._id || !room.members) return false;
    return room.members.some(
      (m) =>
        m.user?._id?.toString() === currentUser._id.toString() ||
        m.user?.toString() === currentUser._id.toString()
    );
  };

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-gray-400 mb-4">
          <Users size={64} />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Rooms Yet
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Be the first to create a room in this community!
        </p>
        <button
          onClick={() => navigate(`/community/${communityId}/createRoom`)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Create First Room
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Community Rooms ({rooms.length})
        </h2>
        <button
          onClick={() => navigate(`/community/${communityId}/createRoom`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          + Create Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const statusMeta =
            ROOM_STATUS_META[room.status] || ROOM_STATUS_META.upcoming;
          const isMember = isUserMember(room);
          const isJoining = joiningRoomId === room._id;

          return (
            <div
              key={room._id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
              onClick={() =>
                navigate(`/community/${room.parentCommunity}/room/${room._id}`)
              }
            >
              {/* Background Image */}
              <div
                className="h-48 bg-cover bg-center relative"
                style={{
                  backgroundImage: `url(${
                    room.roombackgroundImage?.url || ""
                  })`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className="text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                    style={{
                      color: statusMeta.color,
                      backgroundColor: statusMeta.bg,
                    }}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                {/* Trip Tag */}
                {room.roomtype === "Trip" && (
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-600 text-white shadow-lg flex items-center gap-1">
                      <MapPin size={12} />
                      Trip
                    </span>
                  </div>
                )}

                {/* Room Name */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">
                    {room.name}
                  </h3>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4">
                {/* Description */}
                {room.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {room.description}
                  </p>
                )}

                {/* Trip Location */}
                {room.roomtype === "Trip" &&
                  room.linkedTrip?.location?.name && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                      <MapPin size={14} className="text-red-500" />
                      <span className="font-medium">
                        {room.linkedTrip.location.name}
                      </span>
                    </div>
                  )}

                {/* Dates */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <Calendar size={14} />
                  <span>
                    {formatDate(room.startDate)} - {formatDate(room.endDate)}
                  </span>
                </div>

                {/* Tags */}
                {room.roomTags && room.roomTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {room.roomTags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                    {room.roomTags.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                        +{room.roomTags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Creator & Members */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full bg-cover bg-center bg-gray-300"
                      style={{
                        backgroundImage: `url(${
                          room.createdBy?.profilePicture?.url || ""
                        })`,
                      }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">
                        {room.createdBy?.username || "Unknown"}
                      </p>
                      <p className="text-[10px] text-gray-500">Creator</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users size={14} />
                      <span className="text-xs font-semibold">
                        {room.members?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Join Button */}
                {!isMember && (
                  <button
                    onClick={(e) => handleJoinRoom(room._id, e)}
                    disabled={isJoining}
                    className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isJoining ? "Joining..." : "Join Room"}
                  </button>
                )}

                {isMember && (
                  <div className="w-full mt-3 py-2 bg-green-50 text-green-700 rounded-lg font-semibold text-center border border-green-200">
                    ✓ Joined
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomsTab;
