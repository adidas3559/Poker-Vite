import { createContext, useState, useCallback, useRef, type ReactNode } from "react"
import { type Socket, io } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
  connect: () => Socket;
};

const SocketContext = createContext<SocketContextType>({ socket: null, connect: () => { throw new Error('SocketContext not initialised') } });

const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current) return socketRef.current;
    const s = io(import.meta.env.VITE_SOCKET_URL);
    socketRef.current = s;
    setSocket(s);
    return s;
  }, []);

  return <SocketContext.Provider value={{ socket, connect }}>{children}</SocketContext.Provider>
}

export { SocketContext }
export default SocketProvider
