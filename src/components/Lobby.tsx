import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SocketContext } from '../contexts/SocketContext';
import './Lobby.css';

type LocationState = {
  roomName: string;
  nickname: string;
};

const Lobby = () => {
  const { socket, connect } = useContext(SocketContext);
  const { state } = useLocation();
  const { roomName, nickname } = state as LocationState;
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([nickname]);

  useEffect(() => {
    connect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit('createRoom', { roomName, nickname });

    socket.on('roomCreated', ({ roomCode: code }: { roomCode: string }) => {
      setRoomCode(code);
    });

    socket.on('playerJoined', ({ nickname: joined }: { nickname: string }) => {
      setPlayers((prev) => [...prev, joined]);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('playerJoined');
    };
  }, [socket]);

  return (
    <div className="lobby-wrapper">
      <div className="lobby-card">
        <h1 className="lobby-title">{roomName}</h1>

        <div className="room-code-display">
          <p className="room-code-label">Room Code</p>
          <p className="room-code-value">{roomCode ?? '—'}</p>
        </div>

        <div className="lobby-players">
          <p className="room-code-label">Players</p>
          {players.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <button className="btn" onClick={() => navigate('/test-game')}>
          Start Game
        </button>
      </div>
    </div>
  );
};

export default Lobby;
