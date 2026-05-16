import { useLocation, Link } from 'react-router-dom';
import type { PlayerState } from '../types/GameState';
import './PostGame.css';

type LocationState = {
  winner: PlayerState;
};

const PostGame = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;

  const winner = state?.winner;

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
          <Link className="btn" to="/lobby">Rematch</Link>
          <Link className="btn btn-secondary" to="/">Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PostGame;
