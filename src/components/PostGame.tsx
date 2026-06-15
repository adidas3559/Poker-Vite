import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { PlayerState } from '../types/GameState';
import type { StandingEntry } from './WinnerPopup';
import { SocketContext } from '../contexts/SocketContext';
import { getCharacterById } from '../data/characters';
import './PostGame.css';

type LocationState = {
  winner: PlayerState;
  standings?: StandingEntry[];
};

const MEDAL_COLORS = ['#f2d98a', '#cdd3df', '#d39a5a'];

const PostGame = () => {
  const { socket, connect } = useContext(SocketContext);
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const winner = state?.winner;
  const standings = state?.standings ?? [];
  const winnerCharId = standings.find(s => s.id === winner?.id)?.characterId ?? null;
  const winnerImg = getCharacterById(winnerCharId ?? '')?.img;

  const handleRematch = () => {
    const activeSocket = socket ?? connect();
    const roomCode = sessionStorage.getItem('poker_roomCode') ?? '';
    activeSocket.emit('rejoinLobby', { roomCode });
    navigate('/lobby');
  };

  const handleHome = () => {
    const activeSocket = socket ?? connect();
    const roomCode = sessionStorage.getItem('poker_roomCode') ?? '';
    const playerId = sessionStorage.getItem('poker_playerId') ?? '';
    activeSocket.emit('leaveRoom', { roomCode, playerId });
    navigate('/');
  };

  return (
    <div className="postgame-wrapper">
      <div className="postgame-card">
        {/* gold rays */}
        <div className="postgame-rays" aria-hidden>
          <svg width="520" height="520" viewBox="0 0 200 200">
            <path d="M100 100 L108 0 L92 0 Z" fill="#e9c766" />
            <path d="M100 100 L160 8 L146 0 Z" fill="#e9c766" />
            <path d="M100 100 L196 60 L190 46 Z" fill="#e9c766" />
            <path d="M100 100 L200 108 L200 92 Z" fill="#e9c766" />
            <path d="M100 100 L192 154 L200 140 Z" fill="#e9c766" />
            <path d="M100 100 L154 192 L168 184 Z" fill="#e9c766" />
            <path d="M100 100 L108 200 L92 200 Z" fill="#e9c766" />
            <path d="M100 100 L46 192 L60 200 Z" fill="#e9c766" />
            <path d="M100 100 L8 154 L16 168 Z" fill="#e9c766" />
            <path d="M100 100 L0 108 L0 92 Z" fill="#e9c766" />
            <path d="M100 100 L8 46 L0 60 Z" fill="#e9c766" />
            <path d="M100 100 L46 8 L32 16 Z" fill="#e9c766" />
          </svg>
        </div>

        <div className="postgame-content">
          <span className="postgame-label">Game Over</span>

          {winner ? (
            <>
              <div className="postgame-hero">
                <svg className="postgame-crown" width="40" height="30" viewBox="0 0 24 18" aria-hidden>
                  <path d="M2 6l4.5 5L12 2l5.5 9L22 6v10H2z" fill="#f2d98a" stroke="#bd9333" strokeWidth="1" />
                  <circle cx="2" cy="6" r="1.6" fill="#f2d98a" />
                  <circle cx="22" cy="6" r="1.6" fill="#f2d98a" />
                  <circle cx="12" cy="2" r="1.8" fill="#f2d98a" />
                </svg>
                <div className="postgame-avatar">
                  {winnerImg
                    ? <img src={winnerImg} alt="" />
                    : <div className="postgame-avatar-fallback">{winner.name.charAt(0).toUpperCase()}</div>}
                </div>
              </div>

              <h1 className="postgame-winner">{winner.name} Wins!</h1>
              <div className="postgame-chips">
                <span className="postgame-chip-icon">$</span>
                <span>{winner.chips.toLocaleString()} chips</span>
              </div>
            </>
          ) : (
            <h1 className="postgame-winner">Game Over</h1>
          )}

          {standings.length > 0 && (
            <div className="postgame-standings">
              <span className="postgame-standings-title">Final Standings</span>
              {standings.map((p, i) => {
                const img = getCharacterById(p.characterId ?? '')?.img;
                return (
                  <div
                    key={p.id}
                    className={`standings-row${i === 0 ? ' is-winner' : ''}${p.isOut ? ' is-out' : ''}`}
                  >
                    <span className="standings-rank" style={{ color: MEDAL_COLORS[i] ?? '#7c8294' }}>
                      {i + 1}
                    </span>
                    <div className="standings-avatar">
                      {img
                        ? <img src={img} alt="" />
                        : <div className="standings-avatar-fallback">{p.name.charAt(0).toUpperCase()}</div>}
                    </div>
                    <span className="standings-name">{p.name}</span>
                    <span className="standings-chips">{p.isOut ? 'Out' : p.chips.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="postgame-actions">
            <button className="postgame-btn rematch" onClick={handleRematch}>Rematch</button>
            <button className="postgame-btn home" onClick={handleHome}>Home</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostGame;
