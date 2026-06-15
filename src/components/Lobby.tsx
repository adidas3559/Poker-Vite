import { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SocketContext } from '../contexts/SocketContext';
import './JoinHost.css';
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


import { CHARACTERS, getCharacterById } from '../data/characters';

const Lobby = () => {
  const { socket, connect } = useContext(SocketContext);
  const { state } = useLocation();
  const { roomName: initialRoomName, roomCode: initialRoomCode, nickname: initialNickname } = (state ?? {}) as LocationState;
  const nickname = initialNickname ?? sessionStorage.getItem('poker_nickname') ?? '';
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState(initialRoomCode ?? sessionStorage.getItem('poker_roomCode') ?? '');
  const [roomName, setRoomName] = useState(initialRoomName ?? sessionStorage.getItem('poker_roomName') ?? '');
  const roomNameRef = useRef(roomName);
  const [players, setPlayers] = useState<{ id?: string, nickname: string, disconnected?: boolean, characterId?: string }[]>([{ nickname }]);
  const [isHost, setIsHost] = useState(false);
  const [hostNickname, setHostNickname] = useState('');
  const isHostRef = useRef(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [takenCharacterIds, setTakenCharacterIds] = useState<string[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

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
      roomNameRef.current = room.roomName;
      setPlayers(room.players.map(p => ({ id: p.id, nickname: p.nickname, disconnected: p.disconnected, characterId: p.characterId })));
      sessionStorage.setItem('poker_roomCode', room.roomCode);
      sessionStorage.setItem('poker_roomName', room.roomName);
      if (playerId) sessionStorage.setItem('poker_playerId', playerId);
      if (nick) sessionStorage.setItem('poker_nickname', nick);
      const currentNickname = nick ?? sessionStorage.getItem('poker_nickname') ?? '';
      setHostNickname(room.host);
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
      navigate('/game', { state: { roomCode, roomName: roomNameRef.current, playerId, isHost: isHostRef.current, players: charAssignedPlayers } });
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

  const myPlayerId = sessionStorage.getItem('poker_playerId');

  return (
    <div className="th-wrapper">
      <div className="th-card">
        <div className="th-topbar">
          <button className="th-leave" onClick={handleLeave}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Leave
          </button>
          <span className="th-brand">Red Dead Royal</span>
        </div>

        <div className="th-header">
          <div className="th-eyebrow">Saloon Table</div>
          <h1 className="th-title">{roomName || '—'}</h1>
          <div className="th-divider">
            <span />&#9824; &#9830; &#9827;<span />
          </div>
        </div>

        <div className="th-field">
          <label className="th-label" style={{ textAlign: 'center' }}>Room Code</label>
          <div className="lobby-code-pill" onClick={handleCopyCode}>
            <span className="lobby-code-value">{roomCode || '—'}</span>
            <span className="lobby-copy-btn" aria-label="Copy room code">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </span>
          </div>
          <p className="lobby-code-hint">{copied ? 'Copied!' : 'Tap to Copy & Share'}</p>
        </div>

        <div className="char-select">
          <div className="lobby-section-head">
            <label className="th-label">Choose Your Character</label>
          </div>
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
          <div className="lobby-section-head">
            <label className="th-label">Players at the Table</label>
          </div>
          {players.map((p, i) => {
            const character = p.characterId ? getCharacterById(p.characterId) : undefined;
            const isSelf = !!p.id && p.id === myPlayerId;
            const isRowHost = !!hostNickname && p.nickname === hostNickname;
            const ready = !!p.characterId;
            return (
              <div key={p.id ?? `${p.nickname}-${i}`} className={`lobby-player-row${isSelf ? ' self' : ''}${p.disconnected ? ' disconnected' : ''}`}>
                {character ? (
                  <div className="lobby-player-avatar">
                    <img src={character.img} alt={character.name} />
                  </div>
                ) : (
                  <div className="lobby-player-avatar empty">&#9824;</div>
                )}
                <div className="lobby-player-info">
                  <div className="lobby-player-name-row">
                    <span className="lobby-player-name">{p.nickname}</span>
                    {isRowHost && <span className="lobby-badge">Host</span>}
                    {isSelf && !isRowHost && <span className="lobby-badge">You</span>}
                  </div>
                  <div className="lobby-player-sub">{character ? character.name : 'No character yet'}</div>
                </div>
                <span className={`lobby-player-status ${ready ? 'ready' : 'picking'}`}>
                  <span className="lobby-status-dot" />
                  {ready ? 'Ready' : 'Picking...'}
                </span>
              </div>
            );
          })}
        </div>

        {gameActive && (
          <button className="th-cta" onClick={() => {
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
          <button className="th-cta" onClick={() => socket?.emit('startGame', { roomCode })}>
            Start Game
          </button>
        )}
      </div>
    </div>
  );
};

export default Lobby;
