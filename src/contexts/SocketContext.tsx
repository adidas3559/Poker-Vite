import { createContext, useState, type ReactNode } from "react"
import { type Socket, io } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
  connect: () => void;
};

const SocketContext = createContext<SocketContextType>({ socket: null, connect: () => {} });

const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const connect = () => {
    // TODO put this url in an env file
    const s = io('http://localhost:5174')
    setSocket(s);
  }

  return <SocketContext.Provider value={{ socket, connect }}>{children}</SocketContext.Provider>
}

export { SocketContext }
export default SocketProvider
