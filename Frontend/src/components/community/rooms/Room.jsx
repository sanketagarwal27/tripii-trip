// Room.jsx
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import useRoomData from "./hooks/useRoomData";
import useRoomSocket from "./hooks/useRoomSocket";
import useRoomMessages from "./hooks/useRoomMessages";
import useSendRoomMessage from "./hooks/useSendRoomMessage";

import RoomChat from "./components/RoomChat";
import RoomInput from "./components/RoomInput";
import TripInfoCard from "./components/TripInfoCard";
import RoomHeader from "./components/RoomHeader";
import { useEffect, useState } from "react";
import { clearRoomState, setSelectedRoom } from "@/redux/roomSlice";
import React from "react";
import RoomRightSidebar from "./components/RoomRightSidebar";
import RoomSetting from "./components/RoomSetting";

const Room = () => {
  const { roomId } = useParams();
  const dispatch = useDispatch();
  const room = useRoomData(roomId);
  const [setting, setSetting] = useState(false);

  console.log("Room:", room);

  useEffect(() => {
    // 🔥 CLEAR OLD ROOM DATA
    dispatch(clearRoomState());

    // set new room
    dispatch(setSelectedRoom(roomId));

    return () => {
      // 🔥 ALSO clear when leaving room
      dispatch(clearRoomState());
    };
  }, [roomId, dispatch]);

  useEffect(() => {
    if (!roomId || !socket.connected) return;

    // ✅ JOIN ROOM SOCKET
    socket.emit("room:join", roomId);

    return () => {
      // ✅ LEAVE ROOM SOCKET
      socket.emit("room:leave", roomId);
    };
  }, [roomId]);

  const { roomMessages } = useSelector((s) => s.room);

  useRoomSocket(roomId, dispatch);
  useRoomMessages(roomId);

  const { send } = useSendRoomMessage(roomId);

  if (!room) return null;

  return (
    <div className="Room">
      {/* FIXED HEADER */}
      <RoomHeader room={room} setSetting={setSetting} />

      {/* BODY */}
      <div
        className="Room-body"
        style={{
          backgroundImage: `
      radial-gradient(
        circle at bottom,
        rgba(0, 0, 0, 0.6),
        rgba(0, 0, 0, 0.9)
      ),
      url(${room?.roombackgroundImage?.url})
    `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* CHAT */}
        <div className="Room-chat">
          <RoomChat />
        </div>

        {/* INPUT */}
        <RoomInput onSend={send} />
      </div>

      {/* RIGHT SIDEBAR */}
      <RoomRightSidebar room={room} />
      {setting && <RoomSetting setting={setting} setSetting={setSetting} />}
    </div>
  );
};

export default Room;
