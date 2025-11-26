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
    <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col items-center justify-center px-4 py-10 font-inter">
      <div className="bg-gray-800 max-w-md w-full p-10 rounded-3xl shadow-xl flex flex-col items-center gap-6">
        <h1 className="text-amber-500 font-bold text-4xl select-none">Lobby</h1>
        <form onSubmit={handleSubmitForm} className="w-full flex flex-col gap-6">
          <input
            type="text"
            id="room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room number.."
            className="w-full text-center rounded-lg border border-gray-600 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            aria-label="Room number"
            required
          />
          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 focus:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-400 text-white font-semibold py-3 rounded-lg shadow-md transition"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
};

export default Lobby;
