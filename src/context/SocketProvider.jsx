import React, { createContext, useEffect, useState, useMemo, useContext } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthProvider.jsx";
import { SERVER_URL } from "../config.js"

const SocketContext = createContext(null);

export const SocketProvider = (props) => {
//   const socket = useMemo(() => io("localhost:8000"), []);
  // const socket = useMemo(() => io('https://webrtc-basic2.onrender.com'), []);

  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const s = io(SERVER_URL, { auth: { token } });
    setSocket(s);

    // return () => s.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {props.children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
