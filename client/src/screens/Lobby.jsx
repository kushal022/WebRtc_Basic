import React from "react";
import { useCallback } from "react";
import { useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const { socket } = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback((data) => {
    console.log("You have joined the room your data is ", data);
    const { email, room } = data;
    navigate(`/room/${room}`)
  }, []);

  useEffect(() => {
    socket.on("you-joined-room", handleJoinRoom);

    return () => {
      socket.off('you-joined-room', handleJoinRoom)
    }
  }, [socket]);
  return (
    <div>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email ID</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <label htmlFor="room">Room Number</label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <br />
        <button>Join</button>
      </form>
    </div>
  );
};

export default Lobby;
