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

  const [isHost, setIsHost] = useState(false);

  const handleLeave = () => {
    const roomCode = sessionStorage.getItem('poker_roomCode') ?? '';
    const playerId = sessionStorage.getItem('poker_playerId') ?? '';
    socket?.emit('leaveRoom', { roomCode, playerId });
    navigate('/');
  };

  useEffect(() => {
    const activeSocket = socket ?? connect();
    if (!state) {
      activeSocket.emit('rejoinLobby', {
        roomCode: sessionStorage.getItem('poker_roomCode') ?? '',
        playerId: sessionStorage.getItem('poker_playerId') ?? '',
      });
    } else if (initialRoomName && !initialRoomCode) {
      activeSocket.emit('createRoom', { roomName: initialRoomName, nickname: initialNickname });
    } else if (initialRoomCode && !initialRoomName) {
      activeSocket.emit('joinRoom', { roomCode: initialRoomCode, nickname: initialNickname });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const currentNickname = nick ?? sessionStorage.getItem('poker_nickname') ?? '';
      setIsHost(currentNickname === room.host);
      // Clear location state so a page refresh triggers rejoinLobby instead of re-emitting
      // createRoom/joinRoom. replace:true keeps history clean without remounting the component.
      navigate('/lobby', { replace: true, state: null });
    });

    activeSocket.on('gameStarted', ({ roomCode, playerId }: { roomCode: string, playerId: string }) => {
      navigate('/game', { state: { roomCode, playerId, isHost } });
    });

    return () => {
      activeSocket.off('lobbyUpdated');
      activeSocket.off('gameStarted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isHost, connect]);

  return (
    <>
    <button className="back-btn" onClick={handleLeave}>← Leave</button>
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
      </div>
    </div>
    </>
  );
};

export default Lobby;
