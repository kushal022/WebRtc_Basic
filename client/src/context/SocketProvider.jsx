import React, { createContext } from "react";
import { useContext } from "react";
import { useMemo } from "react";
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = (props) => {
    const socket = useMemo(() => io('localhost:8000'), []);

    return (
        <SocketContext.Provider value={{socket}} >
            {props.children}
        </SocketContext.Provider>
    )
}

export const  useSocket = () => useContext(SocketContext);