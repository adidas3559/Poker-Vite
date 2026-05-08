import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HostGame.css';

const HostGame = () => {
  const [roomCode] = useState(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const [roomName, setRoomName] = useState('');
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  return (
    <div className="lobby-wrapper">
      <div className="lobby-card">
        <h1 className="lobby-title">Host Game</h1>

        <div className="room-code-display">
          <p className="room-code-label">Your Room Code</p>
          <p className="room-code-value">{roomCode}</p>
        </div>

        <input
          className="lobby-input"
          type="text"
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />

        <input
          className="lobby-input"
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <button className="btn" onClick={() => navigate('/test-game')}>
          Start Game
        </button>
      </div>
    </div>
  );
};

export default HostGame;
