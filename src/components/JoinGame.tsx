import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinGame.css';

const JoinGame = () => {
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!roomCode.trim() || !nickname.trim()) return;
    navigate('/lobby', { state: { roomCode, nickname } });
  };

  return (
    <div className="lobby-wrapper">
      <div className="lobby-card">
        <h1 className="lobby-title">Join Game</h1>

        <input
          className="lobby-input"
          type="text"
          placeholder="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />

        <input
          className="lobby-input"
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

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
