import { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SocketContext } from '../contexts/SocketContext';
import './Lobby.css';
import selectedCircleImg from '../assets/selectedCircle.png';
import selectedXImg from '../assets/selectedX.png';

type LocationState = {
  roomName?: string;
  roomCode?: string;
  nickname: string;
};

/*
ask about disconnect timers, are they really necessary?

page refresh works fine, but shouldn't let everyone know about a disconnect that small? 
maybe not a big deal but see if that's what the timers could be for

for selectCharacter, is it better to also send playerId/nickname? seems unnecessary to have FE rebuild with sessionStorage

for rejoinLobby, ask about socket.join. Why does socket need to join, do we need to disconnect other socket?
I'm assuming answer is socket and player are 2 different entities. socket is disconnected, but player is kept in player map


*/

type RoomState = {
  roomName: string;
  roomCode: string;
  host: string;
  players: { id: string, socketId: string, nickname: string, characterId?: string, disconnected?: boolean }[];
  gameState?: object;
}


import { CHARACTERS } from '../data/characters';

const Lobby = () => {
  const { socket, connect } = useContext(SocketContext);
  const { state } = useLocation();
  const { roomName: initialRoomName, roomCode: initialRoomCode, nickname: initialNickname } = (state ?? {}) as LocationState;
  const nickname = initialNickname ?? sessionStorage.getItem('poker_nickname') ?? '';
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState(initialRoomCode ?? sessionStorage.getItem('poker_roomCode') ?? '');
  const [roomName, setRoomName] = useState(initialRoomName ?? sessionStorage.getItem('poker_roomName') ?? '');
  const [players, setPlayers] = useState<{ id?: string, nickname: string, disconnected?: boolean, characterId?: string }[]>([{ nickname }]);
  const [isHost, setIsHost] = useState(false);
  const isHostRef = useRef(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [takenCharacterIds, setTakenCharacterIds] = useState<string[]>([]);
  const [gameActive, setGameActive] = useState(false);

  const handleLeave = () => {
    // if (!window.confirm('Are you sure you want to leave?')) return;
    const roomCode = sessionStorage.getItem('poker_roomCode') ?? '';
    const playerId = sessionStorage.getItem('poker_playerId') ?? '';
    socket?.emit('leaveRoom', { roomCode, playerId });
    navigate('/');
  };

  const handleSelectCharacter = (charId: string) => {
    if (takenCharacterIds.includes(charId)) return;
    setSelectedCharacterId(charId);
    const activeSocket = socket ?? connect();
    activeSocket.emit('selectCharacter', {
      roomCode: sessionStorage.getItem('poker_roomCode'),
      playerId: sessionStorage.getItem('poker_playerId'),
      characterId: charId,
    });
  };

  // One-time emit on mount — runs before socket context updates, so no double-fire
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
      setPlayers(room.players.map(p => ({ id: p.id, nickname: p.nickname, disconnected: p.disconnected, characterId: p.characterId })));
      sessionStorage.setItem('poker_roomCode', room.roomCode);
      sessionStorage.setItem('poker_roomName', room.roomName);
      if (playerId) sessionStorage.setItem('poker_playerId', playerId);
      if (nick) sessionStorage.setItem('poker_nickname', nick);
      const currentNickname = nick ?? sessionStorage.getItem('poker_nickname') ?? '';
      const host = currentNickname === room.host;
      setIsHost(host);
      isHostRef.current = host;
      setGameActive(!!room.gameState);

      const myPlayerId = playerId ?? sessionStorage.getItem('poker_playerId');
      const taken = room.players
        .filter(p => p.characterId && p.id !== myPlayerId)
        .map(p => p.characterId!);
      setTakenCharacterIds(taken);

      // Restore own selection if rejoining
      const me = room.players.find(p => p.id === myPlayerId);
      if (me?.characterId) setSelectedCharacterId(me.characterId);

      // Clear location state so a page refresh triggers rejoinLobby instead of re-emitting
      // createRoom/joinRoom. replace:true keeps history clean without remounting the component.
      navigate('/lobby', { replace: true, state: null });
    });

    activeSocket.on('gameStarted', ({ roomCode, playerId, players: charAssignedPlayers }: { roomCode: string, playerId: string, players: RoomState['players'] }) => {
      navigate('/game', { state: { roomCode, playerId, isHost: isHostRef.current, players: charAssignedPlayers } });
    });

    activeSocket.on('error', ({ message }: { message: string }) => {
      navigate('/join-game', { state: { error: message } });
    });

    return () => {
      activeSocket.off('lobbyUpdated');
      activeSocket.off('gameStarted');
      activeSocket.off('error');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

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

        <div className="char-select">
          <p className="room-code-label">Choose Your Character</p>
          <div className="char-grid">
            {CHARACTERS.map(char => {
              const isTaken = takenCharacterIds.includes(char.id);
              const isSelected = selectedCharacterId === char.id;
              return (
                <button
                  key={char.id}
                  className={`char-card${isSelected ? ' selected' : ''}${isTaken ? ' taken' : ''}`}
                  onClick={() => handleSelectCharacter(char.id)}
                  disabled={isTaken}
                >
                  <div className="char-img-wrapper">
                    <img className="char-img" src={char.img} alt={char.name} />
                    {isSelected && <img className="char-overlay" src={selectedCircleImg} alt="" />}
                    {isTaken && <img className="char-overlay" src={selectedXImg} alt="" />}
                  </div>
                  <span className="char-name">{char.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lobby-players">
          <p className="room-code-label">Players</p>
          <div className="lobby-players-grid">
            {players.map((p) => (
              <div key={p.nickname} className={`lobby-player-chip${p.disconnected ? ' disconnected' : ''}`}>
                {p.nickname}{p.disconnected ? ' ⚠' : ''}
              </div>
            ))}
          </div>
        </div>

        {gameActive && (
          <button className="btn" onClick={() => {
            const activeSocket = socket ?? connect();
            activeSocket.emit('joinRoom', {
              roomCode: sessionStorage.getItem('poker_roomCode'),
              nickname: sessionStorage.getItem('poker_nickname'),
            });
          }}>
            Rejoin Game
          </button>
        )}

        {!gameActive && isHost && (
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
