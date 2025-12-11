import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
  createCommunity,
  deleteCommunity,
  getCommunityProfile,
  getUserCommunities,
  searchCommunities,
  searchMyCommunities,
  suggestedCommunities,
  updateCommunitySettings,
} from "../controllers/community/community.controller.js";

import {
  addMembers,
  changeMemberRole,
  getCommunityMembers,
  joinPublicCommunity,
  leaveCommunity,
  removeMember,
  updateDisplayName,
} from "../controllers/community/member.controller.js";

import {
  getActivityTimeline,
  getCommunityActivities,
} from "../controllers/community/activity.controller.js";

import {
  deleteMessage,
  getMessages,
  reactToMessage,
  reportMessage,
  sendMessage,
  togglePinMessage,
  voteOnPoll,
} from "../controllers/community/message.controller.js";

import {
  createRoom,
  deleteRoomMessage,
  getCommunityRooms,
  getMyCommunityRooms,
  getMyRoomsAcrossCommunities,
  getRoomMessages,
  getSuggestedRooms,
  joinRoom,
  leaveRoom,
  reactToRoomMessage,
  sendRoomMessage,
} from "../controllers/community/rooms.controller.js";
import { markAllAsSeen } from "../controllers/user/notification.controller.js";

const router = express.Router();

// protect all routes
router.use(verifyJWT);

/* ---------------------------------------------------------
   COMMUNITY CREATION (WITH MULTER)
--------------------------------------------------------- */
router.post(
  "/createCommunity",
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  createCommunity
);

/* ---------------------------------------------------------
   COMMUNITY SETTINGS / FETCH
--------------------------------------------------------- */
router.post("/communitySetting/:communityId", updateCommunitySettings);
router.get("/getCommunityProfile/:communityId", getCommunityProfile);
router.get("/getMyCommunities", getUserCommunities);
router.get("/searchCommunities", searchCommunities);
router.get("/searchMyCommunities", searchMyCommunities);
router.get("/SuggestedCommunities", suggestedCommunities);
router.delete("/deletecommunity", deleteCommunity);

/* ---------------------------------------------------------
   MEMBERS
--------------------------------------------------------- */
router.post("/joinCommunity/:communityId", joinPublicCommunity);
router.post("/addMember/:communityId", addMembers);
router.post("/removeMember/:communityid", removeMember);
router.post("/leaveCommunity/:communityId", leaveCommunity);
router.post("/changeMemberRole/:communityId", changeMemberRole);
router.get("/getCommunityMembers/:communityId", getCommunityMembers);
router.post("/updateMyDisplaName/:communityId", updateDisplayName);

/* ---------------------------------------------------------
   ACTIVITY
--------------------------------------------------------- */
router.get("/CommunityActivity/:communityId", getCommunityActivities);
router.get("/ActivityTimeline/:communityId", getActivityTimeline);

/* ---------------------------------------------------------
   COMMUNITY MESSAGES
--------------------------------------------------------- */
router.post("/sendCommMess/:communityId", sendMessage);
router.get("/getMessageIncomm/:communityId", getMessages);
router.post("/reactOnMessage/:messageId", reactToMessage);
router.delete("/deleteMessage/:messageId", deleteMessage);
router.post("/pinMessage/:messageId", togglePinMessage);
router.post("/vote/:messageId", voteOnPoll);
router.post("/markAsSeen/:messageId", markAllAsSeen);
router.post("/reportMessage/:messageId", reportMessage);

/* ---------------------------------------------------------
   ROOMS
--------------------------------------------------------- */
router.post("/createRoom/:communityId", createRoom);
router.get("/getCommunityRooms/:communityId", getCommunityRooms);
router.get("/myRoom/:communityId", getMyCommunityRooms);
router.get("/allMyRooms", getMyRoomsAcrossCommunities);
router.get("/suggestedRoom", getSuggestedRooms);
router.post("/joinRoom/:roomId", joinRoom);
router.post("/leaveRoom/:roomId", leaveRoom);
router.post("/:roomId/sendMessage", sendRoomMessage);
router.get("/:roomId/RoomMessage", getRoomMessages);
router.post("/:messageId/react", reactToRoomMessage);
router.delete("/:messageId/deleteMessage", deleteRoomMessage);

export default router;
