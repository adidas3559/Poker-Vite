import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinHost.css';

const HostGame = () => {
  const [roomName, setRoomName] = useState('');
  const [nickname, setNickname] = useState(sessionStorage.getItem('poker_nickname') ?? '');
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!roomName.trim() || !nickname.trim()) return;
    navigate('/lobby', { state: { roomName, nickname } });
  };

  return (
    <div className="th-wrapper">
      <div className="th-card">
        <div className="th-topbar">
          <button className="th-leave" onClick={() => navigate('/')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Leave
          </button>
          <span className="th-brand">Red Dead Royal</span>
        </div>

        <div className="th-header">
          <div className="th-emblem">&#9824;</div>
          <div className="th-eyebrow">Deal 'Em In</div>
          <h1 className="th-title">Host a Table</h1>
          <div className="th-divider">
            <span />&#9824; &#9830; &#9827;<span />
          </div>
        </div>

        <div className="th-field">
          <label className="th-label">Table Name</label>
          <input
            className="th-input"
            type="text"
            placeholder="Name your table"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </div>

        <div className="th-field">
          <label className="th-label">Your Name</label>
          <input
            className="th-input"
            type="text"
            placeholder="Enter your name"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <button
          className="th-cta"
          onClick={handleCreate}
          disabled={!roomName.trim() || !nickname.trim()}
        >
          Create Table
        </button>

        <div className="th-switch" onClick={() => navigate('/join-game')}>
          Joining a friend? <span>Enter a code</span>
        </div>
      </div>
    </div>
  );
};

export default HostGame;
