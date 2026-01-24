import { useSelector } from "react-redux";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Members = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const { trips, tripRoles } = useSelector((s) => s.trip);

  // Get the active trip
  const activeTrip = tripId ? trips.byId?.[tripId] : null;
  const currentTripRoles = tripId ? tripRoles?.[tripId] || [] : [];

  // Merge participants with their roles
  const membersWithRoles = useMemo(() => {
    if (!activeTrip?.participants) return [];

    return activeTrip.participants
      .filter((p) => p.status === "active")
      .map((participant) => {
        const userId =
          typeof participant.user === "object"
            ? participant.user._id
            : participant.user;

        // Find all active roles assigned to this user
        const userRoles = currentTripRoles
          .filter((role) => {
            const roleUserId =
              typeof role.assignedTo === "object"
                ? role.assignedTo._id
                : role.assignedTo;
            return (
              roleUserId?.toString() === userId?.toString() &&
              role.status === "active"
            );
          })
          .map((role) => role.roleName);

        return {
          userId,
          username: participant.user?.username || "Unknown",
          profilePicture: participant.user?.profilePicture?.url,
          joinedAt: participant.joinedAt,
          joinedVia: participant.joinedVia,
          roles: userRoles.length > 0 ? userRoles : ["Member"],
          isCreator:
            activeTrip.createdBy?._id === userId ||
            activeTrip.createdBy === userId,
        };
      })
      .sort((a, b) => {
        // Creator first
        if (a.isCreator) return -1;
        if (b.isCreator) return 1;
        // Then by join date
        return new Date(a.joinedAt) - new Date(b.joinedAt);
      });
  }, [activeTrip, currentTripRoles]);

  if (!tripId) {
    return <div className="p-4">Invalid trip</div>;
  }

  if (!activeTrip) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading trip members...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Trip Members</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {membersWithRoles.map((member) => (
          <div
            key={member.userId}
            onClick={() => navigate(`/profile/${member.userId}`)}
            className="group cursor-pointer bg-gradient-to-br from-sky-50 via-white to-emerald-50 
              rounded-2xl border border-sky-100 shadow-md hover:shadow-xl 
              transition-all duration-300 hover:-translate-y-1 p-5"
          >
            {/* Avatar */}
            <div className="flex justify-center -mt-10 mb-3">
              <div className="relative">
                {member.profilePicture ? (
                  <img
                    src={member.profilePicture}
                    alt={member.username}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 
                      flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg"
                  >
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                )}

                {member.isCreator && (
                  <span
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 
                      px-3 py-0.5 text-xs font-semibold bg-yellow-400 text-black rounded-full shadow"
                  >
                    Leader
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="text-center mt-4">
              <h3 className="font-semibold text-lg text-gray-800 group-hover:text-sky-600 transition">
                {member.username}
              </h3>

              {/* Roles */}
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {member.roles.map((role, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      role === "Member"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {role}
                  </span>
                ))}
              </div>

              {/* Meta */}
              <p className="text-xs text-gray-500 mt-3">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {membersWithRoles.length === 0 && (
        <p className="text-gray-500 text-center py-10">No active members yet</p>
      )}
    </div>
  );
};

export default Members;
