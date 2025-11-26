import React, { useRef } from "react";
import {
  PhoneCall,
  Video,
  Mic,
  X,
  UserCheck,
  Copy,
  Loader,
  Wifi,
  AlertTriangle,
  RotateCw,
  Volume2,
} from "lucide-react";
import { useSocket } from "../context/SocketProvider";
import { useEffect } from "react";
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import ReactPlayer from "react-player";
import peer from "../services/peer";
import CallButton from "../components/CallButton.jsx";
import { useAuth } from "../context/AuthProvider.jsx";

const Room = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();

  // Remote/Receiver State:
  const [remoteSocketId, setRemoteSocketId] = useState(null); // remote user
  const [receiver, setReceiver] = useState(null); // remote user
  const [remoteStream, setRemoteStream] = useState(null);

  // Local/Caller State
  const [myStream, setMyStream] = useState(null);
  const [caller, setCaller] = useState(false);

  // Functionality State
  const [isMakeCall, setIsMakeCall] = useState(false);
  const [callOffer, setCallOffer] = useState(null);
  const [callStatus, setCallStatus] = useState("Idle"); // Idle, Connecting, InCall, Ringing
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true); // Tracks camera direction
  const [callError, setCallError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  //~ --- Refs for Media and Connection ---
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(peer);
  const localStream = useRef(null);

  //? --- Media Access Function ---
  const getLocalStream = useCallback(async (isFront = true) => {
    try {
      // Stop any existing tracks
      // if (localStream.current) {
      // localStream.current.getTracks().forEach((track) => track.stop());
      // }

      const constraints = {
        video: {
          facingMode: isFront ? "user" : "environment",
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // localStream.current = stream;
      // if (localVideoRef.current) {
      // localVideoRef.current.srcObject = stream;
      // }
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setCallError(
        "Media access denied. Check your camera/microphone permissions."
      );
      setCallStatus("Idle");
      return null;
    }
  }, []);

  const sendStream = useCallback(async () => {
    console.log("send Stream click");
    if (myStream) {
      console.log("Sending stream tracks...");
      for (const track of myStream.getTracks()) {
        if (!peer.peer.getSenders().some((sender) => sender.track === track)) {
        peer.peer.addTrack(track, myStream);
        }
      }
    }
  }, [myStream]);

  const showStatusMessage = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  //? -- Call Actions --
  //! Make/Initiate call:
  const initiateCall = useCallback(async () => {
    try {
      setCallStatus("Connecting");
      setCallError("");

      const stream = await getLocalStream(isFrontCamera);
      if (!stream) return;
      //Create offer
      const offer = await peer.getOffer();
      //Make Call
      socket.emit("make:call", { callTo: remoteSocketId, offer, roomId });
      setMyStream(stream);
      console.log("---- Make call success ----");
    } catch (error) {
      console.error("Error initiating call:", error);
      setCallError("Failed to start call. Check console for details.");
      hangUpCall();
    }
  }, [remoteSocketId, socket]);

  //! Ring:
  const handleIncommingCall = useCallback(
    async ({ callFrom, offer }) => {
      console.log(
        `---- Incomming call from ${callFrom.username} (${callFrom.socketId}) ----`
      );
      setRemoteSocketId(callFrom.socketId);
      setCaller(callFrom.username);
      setCallStatus("Ringing");
      setCallOffer(offer);
      // const stream = await navigator.mediaDevices.getUserMedia({
      //   audio: true,
      //   video: true,
      // });
      // setMyStream(stream);
      // Create Answer
      // const ans = await peer.getAnswer(offer);
      // now accept call
      // socket.emit("call:accepted", { to: from, ans }); // data send to caller
    },
    [socket]
  );

  //! Answer:
  const handleAnswer = async () => {
    try {
      const stream = await getLocalStream(isFrontCamera);
      if (!stream) return;
      setMyStream(stream);
      setCallStatus("InCall");

      // Create Answer
      const ans = await peer.getAnswer(callOffer);
      // now accept call
      socket.emit("call:accepted", { to: remoteSocketId, ans, roomId }); // data send to caller
      setTimeout(() => sendStream(), 10);
    } catch (error) {
      console.error("Error answer call:", error);
      setCallError("Failed to answer call. Check console for details.");
      hangUpCall();
    }
  };

  //! notify caller: call accepted
  const handleCallAccepted = useCallback(
    async ({ by, ans }) => {
      console.log(
        `----Notify: Call accepted by ${by.username} (${by.socketId}) ----`
      );
      // setTimeout(() => sendStream(), 3000);
      await peer.setLocalDescription(ans);
      setCallStatus("InCall");
      sendStream();
    },
    [sendStream]
  );

  //! Cut call:
  const hangUpCall = async () => {
    await peer.hangUp();
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.srcObject = null;

    setCallStatus("Idle");
    setRemoteSocketId(null);
    setCallOffer(null);
    setIsMakeCall(false);
    setMyStream(null);
    socket.emit("call:hangup", { to: remoteSocketId });
    navigate("/lobby");
  };

  //^---- Socket Listeners ----
  const handleUserJoinRoom = useCallback((data) => {
    console.log(`${data.username} joined this room ${data.roomId}`);
    setRemoteSocketId(data.socketId);
    setReceiver(data);
    setIsMakeCall(true);
    showStatusMessage(`${data.username} joined this room ${data.roomId} now..`);
  }, []);

  // i will see later this function
  const handleRoomParticipant = useCallback((others) => {
    console.log(`Participant off room: `, others);
  }, []);

  const handleCallHangup = useCallback(
    ({ form }) => {
      hangUpCall();
    },
    [hangUpCall]
  );

  //! Negotiation :
  const handleNegoNeeded = useCallback(async () => {
    try {
      const offer = await peer.getOffer();
      socket.emit("nego:needed:send", { to: remoteSocketId, offer });
      console.log(
        `---- nego:needed:send ----from caller:${socket.id}: ${user.username}`
      );
    } catch (error) {
      console.log(`---- nego:needed:send ---- Error`);
    }
  }, [remoteSocketId, socket]);

  const handleNegoNeddedIncomming = useCallback(
    async ({ from, offer }) => {
      console.log(`---- nego:needed:Incomming ----from: ${from}`);
      const ans = await peer.getAnswer(offer);
      socket.emit("nego:done", { to: from, ans });
      console.log(`---- needed:done send ----`);
    },
    [socket]
  );

  const handleNegoFinal = useCallback(async ({ from, ans }) => {
    console.log(`---- nego:final ----`);
    await peer.setLocalDescription(ans);
    sendStream();
  }, [sendStream]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const trackHandler = () => {
    peer.peer.addEventListener("track", async (event) => {
      const remoteStream = event.streams[0];
      // console.log("remoteStream", remoteStream);
      console.log("Got Tracks!!!");
      setRemoteStream(remoteStream);
    });
  };
  useEffect(() => {
    trackHandler();
    // setTimeout(() => sendStream(), 3000);
  }, []);
  useEffect(() => {
    setTimeout(() => sendStream(), 3000);
  }, [myStream, sendStream]);


  useEffect(() => {
    socket.on("user:joined", handleUserJoinRoom);
    socket.on("room:participants", handleRoomParticipant);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:hangup", handleCallHangup);

    socket.on("nego:needed:incomming", handleNegoNeddedIncomming);
    socket.on("nego:final", handleNegoFinal);

    return () => {
      socket.off("user:joined", handleUserJoinRoom);
      socket.off("room:participants", handleRoomParticipant);

      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:hangup", handleCallHangup);

      socket.off("nego:needed:incomming", handleNegoNeddedIncomming);
      socket.off("nego:final", handleNegoFinal);
    };
  }, [
    socket,
    handleUserJoinRoom,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeddedIncomming,
    handleNegoFinal,
    handleCallHangup,
  ]);

  // ---- Control Handlers -----
  const toggleVideo = () => {
    setIsVideoDisabled((prev) => {
      if (myStream) {
        myStream.getVideoTracks().forEach((track) => (track.enabled = prev));
      }
      return !prev;
    });
  };

  const toggleMic = () => {
    setIsMicMuted((prev) => {
      if (myStream) {
        myStream.getAudioTracks().forEach((track) => (track.enabled = prev));
      }
      return !prev;
    });
  };

  //switching between front and rear cameras
  const rotateCamera = async () => {
    console.log("in rotate camera");
    if (callStatus !== "InCall" && callStatus !== "Connecting") {
      showStatusMessage("Start a call before rotating the camera.");
      return;
    }

    // Stop current tracks and get a new stream with opposite facingMode
    const newIsFront = !isFrontCamera;
    const newStream = await getLocalStream(newIsFront);

    if (newStream) {
      // const videoTrack = newStream.getVideoTracks()[0];

      // // Replace the old track with the new one for the peer
      // const sender = peerConnection.current
      //   .getSenders()
      //   .find((s) => s.track && s.track.kind === "video");
      // if (sender) {
      //   sender.replaceTrack(videoTrack);
      // }
      setMyStream(newStream);
      trackHandler();

      setIsFrontCamera(newIsFront);
      showStatusMessage(
        newIsFront ? "Switched to Front Camera" : "Switched to Rear Camera"
      );
    } else if (!newStream) {
      showStatusMessage(
        "Failed to rotate camera (Permissions issue or device has only one)."
      );
    }
  };

return (
    <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col items-center justify-start relative overflow-hidden font-inter px-4 py-6 md:py-12">
      {/* --- Transient Status Message --- */}
      {statusMessage && (
        <div
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-30 px-6 py-2 bg-indigo-600/95 text-white rounded-full text-sm font-medium shadow-lg animate-fadeInOut max-w-[90vw] text-center"
          role="alert"
          aria-live="assertive"
        >
          {statusMessage}
        </div>
      )}

      {/* --- Head --- */}
      <header className="flex flex-col items-center">
        <h2 className="text-amber-500 font-bold text-3xl sm:text-4xl mb-1 select-none">
          ROOM: {roomId}
        </h2>
        <h3 className="mt-1 text-center text-sm sm:text-base max-w-xs sm:max-w-md px-4 break-words">
          {remoteSocketId ? (
            <span className="text-amber-500 font-semibold italic">
              @{receiver ? receiver.username : "Caller"}
            </span>
          ) : (
            <span className="text-gray-400 italic">
              You will be connected soon... please wait!
            </span>
          )}
        </h3>
      </header>

      {/* ---- Call Button (Idle) ---- */}
      {callStatus === "Idle" && (
        <div className="fixed top-1/2 left-1/2 max-w-sm z-20 p-6 bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl space-y-6 transform -translate-x-1/2 -translate-y-1/2">
          <CallButton
            icon={PhoneCall}
            onClick={() => initiateCall()}
            color="bg-green-600 hover:bg-green-700 focus:ring-green-400"
            label="Call"
            disabled={!remoteSocketId}
          />
        </div>
      )}

      {/* --- Error Alert --- */}
      {callError && (
        <div
          className="fixed bottom-40 left-1/2 transform -translate-x-1/2 z-30 flex items-center px-4 py-3 bg-red-700/95 text-white rounded-lg text-sm font-semibold shadow-xl animate-fadeInOut"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="w-5 h-5 mr-2" aria-hidden="true" />
          {callError}
        </div>
      )}

      {/* INCOMING CALL BANNER */}
      {remoteSocketId && callStatus === "Ringing" && (
        <div className="fixed top-32 bg-green-600 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg animate-bounce z-30 select-none">
          @{caller} is calling...
        </div>
      )}

      {/* Local Stream Preview */}
      {myStream && (
        <div className="fixed top-4 right-4 w-28 h-40 sm:w-36 sm:h-48 bg-gray-800 rounded-xl overflow-hidden shadow-2xl z-40 border-2 border-white/50">
          <video
            ref={(video) => {
              if (video) {
                video.srcObject = myStream;
              }
            }}
            autoPlay
            playsInline
            // muted
            className={`w-full h-full object-cover ${isFrontCamera ? "" : "transform scale-x-[-1]"}`}
          />
        </div>
      )}

      {/* Remote Stream Main Display */}
      <main className="flex-grow flex items-center justify-center w-full max-w-5xl mt-10 mb-24 px-2 sm:px-0">
        {remoteStream ? (
          <video
            ref={(video) => {
              if (video) {
                video.srcObject = remoteStream;
              }
            }}
            autoPlay
            // muted
            className="w-full max-w-full max-h-[75vh] rounded-xl shadow-2xl border-2 border-white/60 object-cover transition-opacity duration-700"
            playsInline
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-600 select-none">
            <Video className="w-16 h-16 opacity-30 mb-4" />
            <p className="text-lg font-light">Waiting for remote user...</p>
          </div>
        )}
      </main>

      {/* Floating Control Bar */}
      {(callStatus === "InCall" ||
        callStatus === "Ringing" ||
        callStatus === "Connecting") && (
        <nav
          className="fixed bottom-6 inset-x-4 z-50 flex justify-center space-x-6 p-4 bg-black/60 backdrop-blur-md rounded-full shadow-2xl"
          aria-label="Call controls"
        >
          <CallButton
            icon={Mic}
            onClick={toggleMic}
            color={isMicMuted ? "bg-red-500" : "bg-indigo-600"}
            active={!isMicMuted}
            label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
          />
          <CallButton
            icon={Video}
            onClick={toggleVideo}
            color={isVideoDisabled ? "bg-red-500" : "bg-indigo-600"}
            active={!isVideoDisabled}
            label={isVideoDisabled ? "Enable video" : "Disable video"}
          />
          <CallButton
            icon={RotateCw}
            onClick={rotateCamera}
            color="bg-gray-700"
            active={true}
            label="Rotate Camera"
            disabled={isVideoDisabled}
          />
          <CallButton
            icon={Volume2}
            color="bg-gray-700"
            active={true}
            label="Speaker"
          />
          {callStatus === "Ringing" ? (
            <CallButton
              icon={UserCheck}
              onClick={handleAnswer}
              color="bg-green-600"
              label="Answer Call"
            />
          ) : (
            <CallButton
              icon={X}
              onClick={hangUpCall}
              color="bg-red-700"
              label="End Call"
            />
          )}
        </nav>
      )}

      <footer className="absolute bottom-0 w-full text-center text-gray-400 text-xs py-2 bg-black/30 select-none">
        Always Free Calling ❤️
      </footer>
    </div>
  );
};

export default Room;
