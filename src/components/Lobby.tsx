import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SocketContext } from '../contexts/SocketContext';
import './Lobby.css';

type LocationState = {
  roomName?: string;
  roomCode?: string;
  nickname: string;
};

type RoomState = {
  roomName: string;
  roomCode: string;
  host: string;
  players: { id: string, socketId: string, nickname: string }[];
}

const Lobby = () => {
  const { socket, connect } = useContext(SocketContext);
  const { state } = useLocation();
  const { roomName: initialRoomName, roomCode: initialRoomCode, nickname: initialNickname } = (state ?? {}) as LocationState;
  const nickname = initialNickname ?? sessionStorage.getItem('poker_nickname') ?? '';
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState(initialRoomCode ?? sessionStorage.getItem('poker_roomCode') ?? '');
  const [roomName, setRoomName] = useState(initialRoomName ?? sessionStorage.getItem('poker_roomName') ?? '');
  // const [playerId, setPlayerId] = useState('');
  const [players, setPlayers] = useState<string[]>([nickname]);

  const [isHost, setIsHost] = useState(!!initialRoomName);

  const handleHome = () => {
    const roomCode = sessionStorage.getItem('poker_roomCode') ?? '';
    const playerId = sessionStorage.getItem('poker_playerId') ?? '';
    socket?.emit('leaveRoom', { roomCode, playerId });
    navigate('/');
  };

  useEffect(() => {
    const activeSocket = socket ?? connect();
    if (!state) {
      const storedRoomCode = sessionStorage.getItem('poker_roomCode') ?? '';
      activeSocket.emit('rejoinLobby', { roomCode: storedRoomCode, playerId: sessionStorage.getItem('poker_playerId') ?? '' });
    }
  }, [socket, connect]);

  useEffect(() => {
    const activeSocket = socket ?? connect();

    activeSocket.on('lobbyUpdated', ({ room, playerId, nickname: nick }: { room: RoomState, playerId?: string, nickname?: string }) => {
      setRoomCode(room.roomCode);
      setRoomName(room.roomName);
      setPlayers(room.players.map(p => p.nickname));
      sessionStorage.setItem('poker_roomCode', room.roomCode);
      sessionStorage.setItem('poker_roomName', room.roomName);
      if (playerId) sessionStorage.setItem('poker_playerId', playerId);
      if (nick) sessionStorage.setItem('poker_nickname', nick);
      console.log('🚀 ~ Lobby ~ nick:', nick);
      console.log('🚀 ~ Lobby ~ room:', room);
      const currentNickname = nick ?? sessionStorage.getItem('poker_nickname') ?? '';
      setIsHost(currentNickname === room.host);
    });

    activeSocket.on('gameStarted', ({ roomCode, playerId }: { roomCode: string, playerId: string }) => {
      navigate('/game', { state: { roomCode, playerId, isHost } });
    });

    return () => {
      activeSocket.off('lobbyUpdated');
      activeSocket.off('gameStarted');
    };
  }, [socket, isHost, connect]);

  return (
    <div className="lobby-wrapper">
      <div className="lobby-card">
        <h1 className="lobby-title">{roomName || '—'}</h1>

        <div className="room-code-display">
          <p className="room-code-label">Room Code</p>
          <p className="room-code-value">{roomCode || '—'}</p>
        </div>

        <div className="lobby-players">
          <p className="room-code-label">Players</p>
          {players.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        {isHost && (
          <button className="btn" onClick={() => socket?.emit('startGame', { roomCode })}>
            Start Game
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleHome}>Home</button>
      </div>
    </div>
  );
};

export default Lobby;
