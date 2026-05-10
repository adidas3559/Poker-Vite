import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Lobby.css';

const DEFAULTS = {
  players: 6,
  startingChips: 1000,
  smallBlind: 10,
  bigBlind: 20,
};

const Lobby = () => {
  const [players, setPlayers] = useState(DEFAULTS.players);
  const [startingChips, setStartingChips] = useState(DEFAULTS.startingChips);
  const [smallBlind, setSmallBlind] = useState(DEFAULTS.smallBlind);
  const [bigBlind, setBigBlind] = useState(DEFAULTS.bigBlind);

  return (
    <div className="lobby-wrapper">
      <h1 className="lobby-title">Lobby</h1>

      <div className="lobby-card">
        <div className="lobby-option">
          <label>Players</label>
          <input
            type="number"
            min={2}
            max={6}
            value={players}
            onChange={e => setPlayers(Number(e.target.value))}
          />
        </div>

        <div className="lobby-option">
          <label>Starting Chips</label>
          <input
            type="number"
            min={10}
            step={10}
            value={startingChips}
            onChange={e => setStartingChips(Number(e.target.value))}
          />
        </div>

        <hr className="lobby-divider" />

        <div className="lobby-option">
          <label>Small Blind</label>
          <input
            type="number"
            min={1}
            value={smallBlind}
            onChange={e => setSmallBlind(Number(e.target.value))}
          />
        </div>

        <div className="lobby-option">
          <label>Big Blind</label>
          <input
            type="number"
            min={2}
            value={bigBlind}
            onChange={e => setBigBlind(Number(e.target.value))}
          />
        </div>
      </div>

      {/* TODO: pass settings to game once logic supports dynamic values */}
      <Link className="btn lobby-start-btn" to="/test-game">Start Game</Link>
    </div>
  );
};

export default Lobby;
