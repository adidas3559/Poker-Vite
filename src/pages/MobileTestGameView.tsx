import { useState } from 'react';
import './Game.css';
import './MobileGame.css';
import CardFront from './CardFront';
import table1 from '../assets/table1.png';
import {
  initGame,
  startNewRound,
  raiseHandler,
  callHandler,
  checkHandler,
  foldHandler,
  allInHandler,
} from '../controllers/gameService';
import type { GameState } from '../types/GameState';

const MobileTestGameView = () => {
  const [game, setGame] = useState<GameState>(initGame());
  const [raiseInput, setRaiseInput] = useState<number>(0);
  const [expandedSeat, setExpandedSeat] = useState<number | null>(0);
  const [expandedTableCards, setExpandedTableCards] = useState(false);
  // console.log('🚀 ~ MobileTestGameView ~ game:', game);

  const { players, tableCards, pot, currentBet, currentPlayerIndex, dealerIndex, phase } = game;

  const drawHandler = () => {
    const newGame = startNewRound(game);
    setGame(newGame);
    setRaiseInput(newGame.bigBlind);
  };

  const handleRaise = () => {
    const newGame = raiseHandler(game, raiseInput);
    if (newGame.error) return;
    setGame(newGame);
    setRaiseInput(game.bigBlind);
  };

  const handleAllIn = () => setGame(allInHandler(game));
  const handleCheck = () => setGame(checkHandler(game));
  const handleCall  = () => setGame(callHandler(game));
  const handleFold  = () => setGame(foldHandler(game));

  const toggleExpand = (index: number) => {
    setExpandedSeat(prev => prev === index ? null : index);
  };

  const getBlindIndex = (startIndex: number) => {
    let index = startIndex;
    do {
      index = (index + 1) % players.length;
    } while (players[index].status === 'busted' || players[index].status === 'folded');
    return index;
  };

  const inActivePhase =
    phase === 'preflop' || phase === 'flop' || phase === 'turn' || phase === 'river';

  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className="mobile-wrapper">

      <div className="mobile-table-area">
        <img className="mobile-table-img" src={table1} alt="table" />

        <div
          className={`mobile-center-info ${expandedTableCards ? ' expanded' : ''}`}
          onClick={() => tableCards.length > 0 && setExpandedTableCards(p => !p)}
        >
          <div className="mobile-community-cards">
            {tableCards.map((card, i) => <CardFront key={i} card={card} />)}
          </div>
          <div className="mobile-pot-info">
            <span className='pot'>Pot: {pot.toLocaleString()}</span>
            <span className='phase'>{phase}</span>
          </div>
        </div>

        {players.map((player, index) => {
          if (player.status === 'busted') return null;
          const isActive   = index === currentPlayerIndex;
          const isFolded   = player.status === 'folded';
          const isExpanded = expandedSeat === index;

          return (
            <div
              className={`mobile-seat mobile-seat-${index + 1}${isFolded ? ' folded' : ''}${isExpanded ? ' expanded' : ''}`}
              key={index}
              onClick={() => player.hand.length > 0 && toggleExpand(index)}
            >
              <div className='mobile-nameplateWrapper'>
                <div className={`mobile-nameplate${isActive ? ' active' : ''}`}>
                  <span className="m-name">{player.name}</span>
                  <span className="m-chips">{player.chips.toLocaleString()}</span>
                </div>
  
                {player.currentBet > 0 && (
                  <span className="mobile-bet-indicator">{player.currentBet}</span>
                )}

                {player.hand.length > 0 && (
                  <div className="mobile-card-wrapper">
                    <CardFront card={player.hand[0]} />
                    <CardFront card={player.hand[1]} />
                  </div>
                )}
              </div>


              {index === dealerIndex && <span className="pin dealer">D</span>}
              {index === getBlindIndex(dealerIndex) && <span className="pin smallBlind">SB</span>}
              {index === getBlindIndex(dealerIndex + 1) && <span className="pin bigBlind">BB</span>}
            </div>
          );
        })}
      </div>

      <div className="mobile-actions">
        {(phase === 'waiting' || phase === 'end') && (
          <button className="btn mobile-full-btn" onClick={drawHandler}>
            {phase === 'waiting' ? 'Deal Cards' : 'Next Round'}
          </button>
        )}

        {inActivePhase && (
          <>
            <div className="mobile-raise-row">
              <input
                className="mobile-raise-input"
                type="number"
                value={raiseInput}
                onChange={(e) => setRaiseInput(parseInt(e.target.value))}
              />
              <button className="btn" onClick={handleRaise}>Raise</button>
            </div>
            <div className="mobile-action-buttons">
              {currentPlayer.currentBet === currentBet &&
                <button className="btn" onClick={handleCheck}>Check</button>
              }
              {currentPlayer.currentBet < currentBet &&
                <button className="btn" onClick={handleCall}>Call</button>
              }
              {currentPlayer.chips !== 0 &&
                <button className="btn" onClick={handleAllIn}>All In</button>
              }
              {currentPlayer.chips === 0 &&
                <button className="btn" onClick={handleCheck}>Skip</button>
              }
              <button className="btn" onClick={handleFold}>Fold</button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default MobileTestGameView;
