import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './JoinHost.css';

const CODE_LEN = 6;

const JoinGame = () => {
  const { state } = useLocation();
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState(sessionStorage.getItem('poker_nickname') ?? '');
  const [error, setError] = useState<string | null>((state as { error?: string })?.error ?? null);
  const navigate = useNavigate();
  const codeInputRef = useRef<HTMLInputElement>(null);

  const handleJoin = () => {
    if (!roomCode.trim() || !nickname.trim()) return;
    navigate('/lobby', { state: { roomCode, nickname } });
  };

  const cells = Array.from({ length: CODE_LEN }, (_, i) => roomCode[i] ?? '');
  const focusIndex = Math.min(roomCode.length, CODE_LEN - 1);

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
          <div className="th-eyebrow">Pull Up a Chair</div>
          <h1 className="th-title">Join the Table</h1>
          <div className="th-divider">
            <span />&#9824; &#9830; &#9827;<span />
          </div>
        </div>

        <div className="th-field">
          <label className="th-label">Room Code</label>
          <div className="th-code" onClick={() => codeInputRef.current?.focus()}>
            {cells.map((ch, i) => (
              <div key={i} className={`th-code-cell${i === focusIndex ? ' active' : ''}`}>{ch}</div>
            ))}
            <input
              ref={codeInputRef}
              className="th-code-input"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={CODE_LEN}
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN));
                setError(null);
              }}
            />
          </div>
        </div>

        <div className="th-field">
          <label className="th-label">Your Name</label>
          <input
            className="th-input"
            type="text"
            placeholder="Enter your name"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setError(null); }}
          />
        </div>

        {error && <p className="th-error">{error}</p>}

        <button
          className="th-cta"
          onClick={handleJoin}
          disabled={!roomCode.trim() || !nickname.trim()}
        >
          Join Game
        </button>

        <div className="th-switch" onClick={() => navigate('/host-game')}>
          Don't have a code? <span>Host a table</span>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;
