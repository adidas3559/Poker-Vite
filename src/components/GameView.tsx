import { useState } from 'react';
import './Game.css';
import './MobileGame.css';
import CardFront from './CardFront';
import table1 from '../assets/table1.png';
import {
  initGame,
  testStartNewRound,
  raiseHandler,
  callHandler,
  checkHandler,
  foldHandler,
  allInHandler,
} from '../controllers/gameService';
import type { GameState, PlayerState } from '../types/GameState';
import WinnerPopup from './WinnerPopup';

const GameView = () => {
  const [game, setGame] = useState<GameState>(initGame());
  const [raiseInput, setRaiseInput] = useState<number>(0);
  const [expandedSeat, setExpandedSeat] = useState<number | null>(0);
  const [expandedTableCards, setExpandedTableCards] = useState(false);

  const { players, tableCards, pot, currentBet, currentPlayerIndex, dealerIndex, phase } = game;

  const drawHandler = () => {
    const newGame = testStartNewRound(game);
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

  const getNextActivePlayer = (startIndex: number) => {
    let index = startIndex;
    do {
      index = (index + 1) % players.length;
    } while (players[index].status === 'busted' || players[index].status === 'folded');
    return index;
  };

  const howManyActivePlayers = (players: PlayerState[]) => {
    const activePlayerCount = players.reduce((count, player) => {
      if (player.status === 'busted') {
        return count;
      }
      return count + 1;
    }, 0);
    
    return activePlayerCount;
  }

  const inActivePhase =
    phase === 'preflop' || phase === 'flop' || phase === 'turn' || phase === 'river';

  const activePlayers = players.filter(p => p.status !== 'busted');
  const gameWinner = activePlayers.length === 1 ? activePlayers[0] : null;

  const currentPlayer = players[currentPlayerIndex];

  return (
    <>
    {gameWinner && <WinnerPopup winner={gameWinner} />}
    <div className="mobile-wrapper">

      <div className="mobile-table-area">
        <img className="mobile-table-img" src={table1} alt="table" />

        <div
          className={`mobile-center-info ${expandedTableCards ? ' expanded' : ''}`}
          onClick={() => tableCards.length > 0 && setExpandedTableCards(p => !p)}
        >
          <div className="mobile-community-cards">
            {tableCards.map((card, i) => {
              return <CardFront key={i} card={card} />;
            })}
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
              {howManyActivePlayers(players) === 2 && index === dealerIndex && <span className="pin smallBlind">SB</span>}
              {howManyActivePlayers(players) === 2 && index === getNextActivePlayer(dealerIndex) && <span className="pin bigBlind">BB</span>}
              {howManyActivePlayers(players) > 2 && index === getNextActivePlayer(dealerIndex) && <span className="pin smallBlind">SB</span>}
              {howManyActivePlayers(players) > 2 && index ===getNextActivePlayer(getNextActivePlayer(dealerIndex)) && <span className="pin bigBlind">BB</span>}
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
    </>
  );
};

export default GameView;
