import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { PlayerState } from '../types/GameState';
import { SocketContext } from '../contexts/SocketContext';
import './PostGame.css';

type LocationState = {
  winner: PlayerState;
};

const PostGame = () => {
  const { socket, connect } = useContext(SocketContext);
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const winner = state?.winner;

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
        {winner ? (
          <>
            <span className="postgame-label">Game Over</span>
            <h1 className="postgame-winner">{winner.name} wins!</h1>
            <span className="postgame-chips">{winner.chips.toLocaleString()} chips</span>
          </>
        ) : (
          <h1 className="postgame-winner">Game Over</h1>
        )}

        <div className="postgame-actions">
          <button className="btn" onClick={handleRematch}>Rematch</button>
          <button className="btn btn-secondary" onClick={handleHome}>Home</button>
        </div>
      </div>
    </div>
  );
};

export default PostGame;
