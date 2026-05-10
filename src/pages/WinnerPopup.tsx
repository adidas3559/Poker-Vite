import { Link } from 'react-router-dom';
import type { PlayerState } from '../types/GameState';

type Props = {
  winner: PlayerState;
};

const WinnerPopup = ({ winner }: Props) => {
  return (
    <div className="winner-overlay">
      <div className="winner-popup">
        <span className="winner-title">Winner</span>
        <p className="winner-name">{winner.name}</p>
        <span className="winner-chips">{winner.chips.toLocaleString()} chips</span>
        <Link className="btn" to="/post-game" state={{ winner }}>Continue</Link>
      </div>
    </div>
  );
};

export default WinnerPopup;
