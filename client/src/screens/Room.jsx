import React from "react";
import { useSocket } from "../context/SocketProvider";
import { useEffect } from "react";
import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useState } from "react";
import ReactPlayer from "react-player";
import peer from "../services/peer";

const Room = () => {
  const { socket } = useSocket();
  const { roomId } = useParams();

  const [remoteSocketId, setRemoteSocketId] = useState(null); // remote user
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const handleUserJoinRoom = useCallback(({ email, id }) => {
    console.log(`Email: ${email} joined this room ${roomId}`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    //Create offer
    const offer = await peer.getOffer();
    //Make Call
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(async ({ from, offer }) => {
    console.log("IncommingCall: ", from, "offer: ", offer);
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
    // Create Answer
    const ans = await peer.getAnswer(offer);
    // now accept call
    socket.emit("call:accepted", { to: from, ans }); // data send to caller
  }, [socket]);

  const sendStream = useCallback(async () => {
  if (myStream) {
    for (const track of myStream.getTracks()) {
      if (!peer.peer.getSenders().some(sender => sender.track === track)) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }
}, [myStream]);


  const handleCallAccepted = useCallback(
    async ({ from, ans }) => {
      await peer.setLocalDescription(ans);
      console.log("Call Accepted!!!");
      sendStream()
    },
    [sendStream]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  const handleNegoNeddedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoFinal = useCallback(
    async ({ from, ans }) => {
      await peer.setLocalDescription(ans);
    },
    []
  );

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", async (event) => {
      const remoteStream = event.streams[0];
      console.log('Got Tracks!!!')
      setRemoteStream(remoteStream);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoinRoom);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeddedIncomming);
    socket.on("peer:nego:final", handleNegoFinal);

    return () => {
      socket.off("user:joined", handleUserJoinRoom);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeddedIncomming);
      socket.off("peer:nego:final", handleNegoFinal);
    };
  }, [
    socket,
    handleUserJoinRoom,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeddedIncomming,
    handleNegoFinal,
  ]);

  return (
    <div>
      <h2>Room</h2>
      <h3>{remoteSocketId ? "Connected" : "No one in the Room!"}</h3>
      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
      {remoteStream && <button onClick={sendStream}>send Stream</button>}
      {myStream && (
        <>
          <h3>My Stream </h3>
          <video
            ref={(video) => {
              if (video) {
                video.srcObject = myStream;
              }
            }}
            autoPlay
            muted
            height={100}
            width={200}
          />
        </>
      )}
      {remoteStream && (
        <>
          <h3>Caller Stream </h3>
          <video
            ref={(video) => {
              if (video) {
                video.srcObject = remoteStream;
              }
            }}
            autoPlay
            muted
            height={200}
            width={300}
          />
        </>
      )}
    </div>
  );
};

export default Room;
