
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneCall, Video, Mic, X, UserCheck, Copy, Loader, Wifi, AlertTriangle, RotateCw, Volume2 } from 'lucide-react';

// --- Global Setup (Required by the environment for authentication) ---
// Note: This is a client-side demonstration. The signaling server is mocked.
const apiKey = ""; 

const MOCK_SIGNALING_SERVER_URL = "ws://mock-signaling-server.com:3001";
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

// Simple ID Generator to simulate a user being logged in
const generateUserId = () => user_${Math.random().toString(36).substring(2, 9)};

// Mock Socket.IO client interface for demonstration
const MockSocket = (url) => ({
    id: generateUserId(), // This is the user's socket ID
    on: (event, handler) => {
        // In a real app, this registers listeners for server messages
        console.log([Socket] Listening for: ${event});
    },
    emit: (event, data) => {
        // In a real app, this sends data to the server
        console.log([Socket] Emitting ${event}:, data);
    },
    disconnect: () => console.log("[Socket] Disconnected"),
    connect: () => console.log("[Socket] Connected to Mock Signaling Server"),
});

const App = () => {
    // --- State Management ---
    const [userId, setUserId] = useState('');
    const [remoteId, setRemoteId] = useState('');
    const [callStatus, setCallStatus] = useState('Idle'); // Idle, Connecting, InCall, Ringing
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoDisabled, setIsVideoDisabled] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true); // Tracks camera direction
    const [callError, setCallError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // --- Refs for Media and Connection ---
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const socket = useRef(null);
    const localStream = useRef(null);

    // --- Utility: Show non-alert message ---
    const showStatusMessage = (msg) => {
        setStatusMessage(msg);
        setTimeout(() => setStatusMessage(''), 3000);
    };

    // --- Initialization: Auth and Stream Setup ---
    useEffect(() => {
        const id = generateUserId();
        setUserId(id);

        const mockSocket = MockSocket(MOCK_SIGNALING_SERVER_URL);
        socket.current = mockSocket;
        mockSocket.connect();
        
        mockSocket.on('connect', () => {
            console.log("Socket Connected. My ID:", mockSocket.id);
        });
        
        mockSocket.on('call-made', async ({ signal, from }) => {
            setRemoteId(from);
            setCallStatus('Ringing');
            console.log(Incoming call from ${from});
        });

        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
            if (localStream.current) {
                localStream.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // --- Media Access Function ---
    const getLocalStream = useCallback(async (isFront = true) => {
        try {
            // Stop any existing tracks
            if (localStream.current) {
                localStream.current.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: isFront ? 'user' : 'environment'
                },
                audio: true
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStream.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            setCallError("Media access denied. Check your camera/microphone permissions.");
            setCallStatus('Idle');
            return null;
        }
    }, []);

    // --- WebRTC Core Functions ---

    const setupPeerConnection = useCallback((stream) => {
        if (!stream) return;

        peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

        stream.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, stream);
        });

        peerConnection.current.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.current.emit('ice-candidate', {
                    to: remoteId,
                    candidate: event.candidate,
                });
            }
        };

        peerConnection.current.onconnectionstatechange = () => {
            const state = peerConnection.current.connectionState;
            console.log("Peer connection state:", state);
            if (state === 'connected') {
                setCallStatus('InCall');
            } else if (state === 'disconnected' || state === 'failed') {
                hangUp();
                setCallError('Call disconnected due to network failure.');
            }
        };
    }, [remoteId]);


    // --- Call Actions ---

    const initiateCall = async (targetId) => {
        if (!targetId || targetId === userId) {
            setCallError("Invalid target ID.");
            return;
        }
        setRemoteId(targetId);
        setCallStatus('Connecting');
        setCallError('');

        const stream = await getLocalStream(isFrontCamera);
        if (!stream) return;

        setupPeerConnection(stream);

        try {
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            socket.current.emit('call-user', {
                userToCall: targetId,
                signalData: peerConnection.current.localDescription,
                from: userId,
            });

        } catch (error) {
            console.error("Error initiating call:", error);
            setCallError('Failed to start call. Check console for details.');
            hangUp();
        }
    };

    const handleAnswer = async () => {
        if (!peerConnection.current) return;
        setCallStatus('Connecting');
        setCallError('');
        
        const stream = await getLocalStream(isFrontCamera);
        if (!stream) return;
        
        setupPeerConnection(stream);
        
        try {
            // NOTE: In a real app, the incoming offer SDP would be set here

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            socket.current.emit('answer-call', { 
                signal: peerConnection.current.localDescription, 
                to: remoteId 
            });

            setCallStatus('InCall'); 

        } catch (error) {
            console.error("Error answering call:", error);
            setCallError('Failed to answer call.');
            hangUp();
        }
    };

    const hangUp = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.srcObject = null;

        setCallStatus('Idle');
        setRemoteId('');
        socket.current.emit('call-hangup', { to: remoteId });
    };

    // --- Control Handlers ---

    const toggleMic = () => {
        setIsMicMuted(prev => {
            if (localStream.current) {
                localStream.current.getAudioTracks().forEach(track => track.enabled = prev);
            }
            return !prev;
        });
    };

    const toggleVideo = () => {
        setIsVideoDisabled(prev => {
            if (localStream.current) {
                localStream.current.getVideoTracks().forEach(track => track.enabled = prev);
            }
            return !prev;
        });
    };
    
    // Simulates switching between front and rear cameras
    const rotateCamera = async () => {
        if (callStatus !== 'InCall' && callStatus !== 'Connecting') {
            showStatusMessage("Start a call before rotating the camera.");
            return;
        }
        
        // Stop current tracks and get a new stream with opposite facingMode
        const newIsFront = !isFrontCamera;
        const newStream = await getLocalStream(newIsFront);
        
        if (newStream && peerConnection.current) {
            const videoTrack = newStream.getVideoTracks()[0];
            
            // Replace the old track with the new one for the peer
            const sender = peerConnection.current.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
                sender.replaceTrack(videoTrack);
            }
            
            setIsFrontCamera(newIsFront);
            showStatusMessage(newIsFront ? "Switched to Front Camera" : "Switched to Rear Camera");
        } else if (!newStream) {
            showStatusMessage("Failed to rotate camera (Permissions issue or device has only one).");
        }
    };

    // --- UI Component Helpers ---
    
    const CallButton = ({ icon: Icon, onClick, color, label, active = true, disabled = false }) => {
        const baseStyle = 'p-3 sm:p-4 rounded-full transition-all duration-300 shadow-xl';
        const activeColor = color;
        const inactiveColor = 'bg-gray-600';
        
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`flex flex-col items-center justify-center ${baseStyle} 
                            ${active ? activeColor : inactiveColor} 
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-90'}`}
                title={label}
            >
                <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </button>
        );
    };
    
    // --- Render ---
    return (
        // Full screen, mobile-like container
        <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-start relative overflow-hidden font-inter">
            
            {/* --- Remote/Main Video Display --- */}
            <div className="w-full h-full absolute inset-0">
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-700 
                                ${callStatus === 'InCall' ? 'opacity-100' : 'opacity-10'}`}
                />
                
                {/* Fallback/Status Background */}
                {callStatus !== 'InCall' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white">
                        <Video className="w-16 h-16 mb-4 text-indigo-400 opacity-80" />
                        <h1 className="text-3xl font-light">WebRTC Caller</h1>
                        {remoteId && <p className="mt-2 text-xl font-semibold">{callStatus === 'Ringing' ? 'Incoming Call...' : remoteId.substring(0, 8)}</p>}
                        
                        {callStatus === 'Connecting' && <Loader className="w-8 h-8 mt-4 animate-spin text-indigo-400" />}
                    </div>
                )}
            </div>

            {/* --- Local Video (Picture-in-Picture) --- */}
            {(callStatus !== 'Idle' && !isVideoDisabled) && (
                <div className="absolute top-4 right-4 w-28 h-40 sm:w-36 sm:h-48 bg-gray-700 rounded-xl overflow-hidden shadow-2xl z-20 border-2 border-white/50">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={w-full h-full object-cover ${isFrontCamera ? '' : 'transform scale-x-[-1]'}}
                    />
                </div>
            )}
            
            {/* --- User ID Header (Visible in Idle/Ringing) --- */}
            {(callStatus === 'Idle' || callStatus === 'Ringing' || callStatus === 'Connecting') && (
                <header className="absolute top-0 w-full p-4 z-10">
                    <div className="flex justify-between items-center text-white p-3 bg-black/50 backdrop-blur-sm rounded-xl shadow-lg">
                        <div className="flex items-center text-sm font-mono">
                            <Wifi className="w-4 h-4 mr-1 text-green-400" />
                            <span className="truncate">{userId}</span>
                        </div>
                        <Copy 
                            className="w-4 h-4 ml-2 cursor-pointer text-gray-300 hover:text-white" 
                            onClick={() => {
                                // Simplified copy to clipboard logic
                                document.execCommand('copy', false, userId);
                                showStatusMessage('User ID copied to clipboard!');
                            }}
                            title="Copy ID"
                        />
                    </div>
                </header>
            )}

            {/* --- Transient Status Message --- */}
            {statusMessage && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 p-2 px-4 bg-indigo-600/90 text-white rounded-full text-sm font-medium shadow-lg transition-all duration-300">
                    {statusMessage}
                </div>
            )}

            {/* --- Call Input (Only visible when Idle) --- */}
            {callStatus === 'Idle' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-sm z-10 p-6 bg-black/50 backdrop-blur-sm rounded-2xl shadow-2xl space-y-4">
                    <input
                        type="text"
                        placeholder="Enter Remote User ID to Call"
                        value={remoteId}
                        onChange={(e) => setRemoteId(e.target.value)}
                        className="w-full p-3 border border-gray-600 bg-gray-800 text-white rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                    />
                    <CallButton 
                        icon={PhoneCall} 
                        onClick={() => initiateCall(remoteId)} 
                        color="bg-green-600" 
                        label="Call" 
                        disabled={!remoteId}
                    />
                </div>
            )}
            
            {/* --- Error Alert --- */}
            {callError && (
                <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 z-30 flex items-center p-3 bg-red-600/90 text-white rounded-xl text-sm font-medium shadow-2xl">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {callError}
                </div>
            )}

            {/* --- Floating Control Bar (In Call / Ringing) --- */}
            {(callStatus === 'InCall' || callStatus === 'Ringing' || callStatus === 'Connecting') && (
                <div className="absolute bottom-6 w-full px-4 z-20">
                    <div className="flex justify-center space-x-4 p-4 bg-black/50 backdrop-blur-md rounded-full shadow-2xl">
                        
                        {/* 1. Mic Toggle */}
                        <CallButton
                            icon={Mic}
                            onClick={toggleMic}
                            color={isMicMuted ? 'bg-red-500' : 'bg-indigo-600'}
                            active={!isMicMuted}
                            label={isMicMuted ? 'Unmute' : 'Mute'}
                        />
                        
                        {/* 2. Video Toggle */}
                        <CallButton
                            icon={Video}
                            onClick={toggleVideo}
                            color={isVideoDisabled ? 'bg-red-500' : 'bg-indigo-600'}
                            active={!isVideoDisabled}
                            label={isVideoDisabled ? 'Enable Video' : 'Disable Video'}
                        />

                        {/* 3. Camera Rotate */}
                        <CallButton
                            icon={RotateCw}
                            onClick={rotateCamera}
                            color={'bg-gray-700'}
                            active={true}
                            label={'Rotate Camera'}
                            disabled={isVideoDisabled}
                        />

                        {/* 4. Speaker/Audio Toggle (Mock) */}
                         <CallButton
                            icon={Volume2}
                            onClick={() => showStatusMessage("Speaker toggle mock")}
                            color={'bg-gray-700'}
                            active={true}
                            label={'Speaker'}
                        />

                        {/* 5. Answer/Hangup */}
                        {callStatus === 'Ringing' ? (
                            <CallButton
                                icon={UserCheck}
                                onClick={handleAnswer}
                                color="bg-green-600"
                                label="Answer"
                            />
                        ) : (
                            <CallButton 
                                icon={X} 
                                onClick={hangUp} 
                                color="bg-red-700" 
                                label="End Call"
                            />
                        )}
                    </div>
                </div>
            )}
            
            {/* Technical Disclaimer */}
            <footer className="absolute bottom-0 text-sm text-gray-300 text-center w-full p-2 z-10 bg-black/50">
                <p>⚠ Client-Side Demo: Requires a separate *Signaling Server* for actual connection.</p>
            </footer>

        </div>
    );
};

export default App;