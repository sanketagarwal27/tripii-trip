import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user/user.model.js";
import { Trip } from "../../models/trip/trip.model.js";
import { Contribution } from "../../models/contribution/contribution.model.js";

export const getAppOverview = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ accountStatus: "active" });
  const bannedUsers = await User.countDocuments({ accountStatus: "banned" });
  const totalTrips = await Trip.countDocuments();
  const ongoingTrips = await Trip.countDocuments({ isClosed: false });
  const closedTrips = totalTrips - ongoingTrips;
  const pendingContributions = await Contribution.countDocuments({
    status: "Pending",
  });
  const approvedContributions = await Contribution.countDocuments({
    status: "Approved",
  });
  const rejectedContributions = await Contribution.countDocuments({
    status: "Rejected",
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalTrips,
        ongoingTrips,
        closedTrips,
        pendingContributions,
        approvedContributions,
        rejectedContributions,
      },
      "App Overview fetched successfully"
    )
  );
});
