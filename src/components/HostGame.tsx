import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HostGame.css';

const HostGame = () => {
  const [roomName, setRoomName] = useState('');
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!roomName.trim() || !nickname.trim()) return;
    navigate('/lobby', { state: { roomName, nickname } });
  };

  return (
    <div className="lobby-wrapper">
      <div className="lobby-card">
        <h1 className="lobby-title">Host Game</h1>

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

        <button
          className="btn"
          onClick={handleCreate}
          disabled={!roomName.trim() || !nickname.trim()}
        >
          Create Room
        </button>
      </div>
    </div>
  );
};

export default HostGame;
