import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const WebSocketContext = createContext(null);

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/ws/';

export const WebSocketProvider = ({ children }) => {
    const [lastMessage, setLastMessage] = useState(null);
    const ws = useRef(null);

    useEffect(() => {
        const connect = () => {
            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                console.log('WebSocket Connected');
            };

            ws.current.onmessage = (event) => {
                const message = JSON.parse(event.data);
                setLastMessage(message);
            };

            ws.current.onclose = () => {
                console.log('WebSocket Disconnected. Reconnecting...');
                setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ lastMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
