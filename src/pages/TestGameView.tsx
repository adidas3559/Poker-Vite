import { useState } from 'react';
import './Game.css';
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
import type { GameState } from '../types/GameState';

const TestGameView = () => {
  const [game, setGame] = useState<GameState>(initGame());
  const [raiseInput, setRaiseInput] = useState<number>(0);

  const { players, tableCards, pot, currentBet, currentPlayerIndex, dealerIndex, phase } = game;

  const drawHandler = () => {
    const newGame = testStartNewRound(game);
    setGame(newGame);
    setRaiseInput(newGame.bigBlind);
  };

  const handleRaise = () => {
    const newGame = raiseHandler(game, raiseInput);
    if (newGame.error) {
      console.log(newGame.error);
      return;
    }
    setGame(newGame);
    setRaiseInput(game.bigBlind);
  };

  const handleAllIn = () => {
    setGame(allInHandler(game));
  };

  const handleCheck = () => {
    setGame(checkHandler(game));
  };

  const handleCall = () => {
    setGame(callHandler(game));
  };

  const handleFold = () => {
    setGame(foldHandler(game));
  };

  const getBlindIndex = (startIndex: number) => {
    let index = startIndex;
    do {
      index = (index + 1) % players.length;
    } while (players[index].status === 'busted' || players[index].status === 'folded');
    return index;
  };

  return (
    <>
      <div className="gameWrapper">
        {phase === 'waiting' &&
          <div className='drawBtn'>
            <button className='btn' onClick={drawHandler}>Draw Test Cards</button>
          </div>
        }
        {(phase === 'preflop' || phase === 'flop' || phase === 'turn' || phase === 'river') &&
          <div className='drawBtn'>
            <span>{players[currentPlayerIndex]?.name ?? ''}</span>
            <span>total chips: {players[currentPlayerIndex]?.chips || 0}</span>
            <span>pot: {pot}</span>
            <span>Player Bet: {players[currentPlayerIndex].currentBet}</span>
            <input type="number" value={raiseInput} onChange={(e) => setRaiseInput(parseInt(e.target.value))} />
            <button className='btn' onClick={handleRaise}>Raise</button>
            {players[currentPlayerIndex].currentBet === currentBet &&
              <button className='btn' onClick={handleCheck}>Check</button>
            }
            {players[currentPlayerIndex].currentBet < currentBet &&
              <button className='btn' onClick={handleCall}>Call</button>
            }
            {players[currentPlayerIndex].chips !== 0 &&
              <button className='btn' onClick={handleAllIn}>All In</button>
            }
            {players[currentPlayerIndex].chips === 0 &&
              <button className='btn' onClick={handleCheck}>Skip</button>
            }
            <button className='btn' onClick={handleFold}>Fold</button>
          </div>
        }
        {phase === 'end' &&
          <div className='drawBtn'>
            <button className='btn' onClick={drawHandler}>Start Round</button>
          </div>
        }

        <div className="table">
          <img className='tableImg' src={table1} alt="table" />

          <p className='gameState'>
            Total Pot: {pot.toLocaleString()} &nbsp;|&nbsp; {phase}
          </p>

          <div className='tableCards'>
            {tableCards.map((card, i) => (
              <CardFront key={i} card={card} />
            ))}
          </div>

          {players.map((player, index) => {
            if (player.hand.length === 0) return null;
            return (
              <div
                className={`playerHand player${index + 1}${player.status === 'folded' ? ' folded' : ''}`}
                key={`playerHand-${index + 1}`}
              >
                <div className='cardWrapper'>
                  <CardFront card={player.hand[0]} />
                  <CardFront card={player.hand[1]} />
                </div>
                <div className={`playerHandName${index === currentPlayerIndex ? ' active' : ''}`}>
                  <span className='name'>{player.name}</span>
                  <hr />
                  <span className='chips'>{player.chips.toLocaleString()}</span>
                </div>
                {index === dealerIndex &&
                  <span className="pin dealer">Dealer</span>
                }
                {index === getBlindIndex(dealerIndex) &&
                  <span className="pin smallBlind">Small</span>
                }
                {index === getBlindIndex(dealerIndex + 1) &&
                  <span className="pin bigBlind">Big</span>
                }
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default TestGameView;
