import { Link } from 'react-router-dom';
import type { CardState, PlayerState } from '../types/GameState';
import { getCharacterById } from '../data/characters';

export type StandingEntry = {
  id: string;
  name: string;
  chips: number;
  characterId: string | null;
  isOut: boolean;
};

type Props = {
  winner: PlayerState;
  players: PlayerState[];
  characterMap: Record<string, string>;
};

const cardSrc = (c: CardState) => `../assets/cardsAlt/${c.suit}-${c.number}.svg`;

const WinnerPopup = ({ winner, players, characterMap }: Props) => {
  const winnerImg = getCharacterById(characterMap[winner.id] ?? '')?.img;

  const standings: StandingEntry[] = [...players]
    .sort((a, b) => {
      const aOut = a.status === 'busted';
      const bOut = b.status === 'busted';
      if (aOut !== bOut) return aOut ? 1 : -1;
      return b.chips - a.chips;
    })
    .map(p => ({
      id: p.id,
      name: p.name,
      chips: p.chips,
      characterId: characterMap[p.id] ?? null,
      isOut: p.status === 'busted',
    }));

  return (
    <div className="winner-overlay">
      <div className="winner-popup">
        <span className="winner-title">Hand Winner</span>

        <div className="winner-hero">
          <div className="winner-avatar">
            {winnerImg
              ? <img src={winnerImg} alt="" />
              : <div className="winner-avatar-fallback">{winner.name.charAt(0).toUpperCase()}</div>}
          </div>
          <p className="winner-name">{winner.name}</p>
        </div>

        {winner.hand?.length > 0 && (
          <div className="winner-hand">
            {winner.hand.map((c, i) => (
              <img key={i} src={cardSrc(c)} alt="" />
            ))}
          </div>
        )}

        <div className="winner-chip-box">
          <span className="winner-chip-icon">$</span>
          <span className="winner-chip-amount">{winner.chips.toLocaleString()}</span>
          <span className="winner-chip-label">Chips</span>
        </div>

        <Link className="winner-continue" to="/post-game" state={{ winner, standings }}>
          Continue
        </Link>
      </div>
    </div>
  );
};

export default WinnerPopup;
