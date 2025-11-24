import React from "react";
import { useCallback } from "react";
import { useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const [roomId, setRoomId] = useState("");

  const { socket } = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { roomId });
      setRoomId("")
    },
    [ roomId, socket]
  );

  //^ Socket Handles:
  const handleJoinRoom = useCallback((data) => {
    console.log("You have joined the room your data is: ", data);
    navigate(`/room/${data.roomId}`);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("you-joined-room", handleJoinRoom);

    return () => {
      socket.off("you-joined-room", handleJoinRoom);
    };
  }, [socket]);
  return (
    <div className="min-h-screen w-full bg-gray-900 text-white flex gap-2 flex-col items-center justify-center relative overflow-hidden font-inter ">
      <div className="bg-gray-800 p-10 flex items-center justify-center flex-col gap-2">
        <h1 className="text-amber-700 font-bold text-2xl">Lobby</h1>
        <form onSubmit={handleSubmitForm}>
          <input
            type="text"
            id="room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room number.."
            className="border-b border-gray-500 px-1 py-0.5 text-center focus:outline-0 "
          />
          <br />
          <button className="text-center w-full mt-5 bg-gray-900 p-2 rounded cursor-pointer hover:bg-amber-700 transition-all duration-300">
            Join
          </button>
        </form>
      </div>
    </div>
  );
};

export default Lobby;
