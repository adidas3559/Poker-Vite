import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './JoinGame.css';

const JoinGame = () => {
  const { state } = useLocation();
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState(sessionStorage.getItem('poker_nickname') ?? '');
  const [error, setError] = useState<string | null>((state as { error?: string })?.error ?? null);
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!roomCode.trim() || !nickname.trim()) return;
    navigate('/lobby', { state: { roomCode, nickname } });
  };

  return (
    <div className="lobby-wrapper">
      <button className="back-btn" onClick={() => navigate('/')}>← Leave</button>
      <div className="lobby-card">
        <h1 className="lobby-title">Join Game</h1>

        <input
          className="lobby-input"
          type="text"
          placeholder="Room code"
          value={roomCode}
          onChange={(e) => { setRoomCode(e.target.value); setError(null); }}
        />

        <input
          className="lobby-input"
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => { setNickname(e.target.value); setError(null); }}
        />

        {error && <p className="lobby-error">{error}</p>}

        <button
          className="btn"
          onClick={handleJoin}
          disabled={!roomCode.trim() || !nickname.trim()}
        >
          Join
        </button>
      </div>
    </div>
  );
};

export default JoinGame;
