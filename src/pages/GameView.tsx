import { useState } from 'react';
import CardFront from './CardFront';
import Player from '../models/Player';
import Card from '../models/Card';
import table1 from '../assets/table1.png';
import { cDealCards, cRaiseHandler, cCheckHandler, cCallHandler, cFoldHandler } from '../controllers/game';

const GameView = () => {
  type states = 'none' | 'preflop' | 'flop' | 'turn' | 'river' | 'end';
  type reponse = {
    gamestate: states,
    tableCards: Card[],
    currentPlayerIndex: number,
    pot: number,
    currentBet: number,
    players: Player[],
    winners: Player[],
    error: string,
  }

  const [gameState, setGameState] = useState<states>('none');
  const [pot, setPot] = useState<number>(0);
  const [currentBet, setCurrentBet] = useState<number>(0); // big blind
  const [tableCards, setTableCards] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  // const [smallBlind, setSmallBlind] = useState<number>(2);
  // const [bigBlind, setBigBlind] = useState<number>(4);
  const [dealerIndex, setDealerIndex] = useState<number>(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);

  const [raiseInput, setRaiseInput] = useState<number>(0);

  const drawHandler = () => {
    // use game class
    const { mDealerIndex, mPlayers, mPot, mCurrentPlayerIndex, mCurrentBet, mGameState, mTableCards } = cDealCards();
    setDealerIndex(mDealerIndex);
    // setSmallBlind(mSmallBlind);
    // setBigBlind(mBigBlind);
    setPlayers(mPlayers);
    setPot(mPot);
    setCurrentPlayerIndex(mCurrentPlayerIndex);
    setCurrentBet(mCurrentBet);
    setGameState(mGameState);
    setTableCards(mTableCards);
    setRaiseInput(4); // TODO This should be big blind
  }

  const raiseHandler = () => {
    if (raiseValidator(raiseInput)){
      const response = cRaiseHandler(raiseInput);
      stateUpdate(response);
    }
  }
  const allInHandler = () => {
    // const response = cAllInHandler();
    // console.log('🚀 ~ allInHandler ~ response:', response);
    // setTableCards(response.tableCards);
    // setGameState(response.gamestate);
    // setCurrentBet(response.currentBet);
    // setCurrentPlayerIndex(response.currentPlayerIndex);
    // setPot(response.pot);
    // if (response.gamestate === 'end') {
    //   declareWinner(response.winners);
    // }
    const allInAmount = players[currentPlayerIndex].chips - currentBet;
    setRaiseInput(allInAmount);
  }

  const raiseValidator = (raiseAmount: number) => {
    if (raiseAmount + currentBet > players[currentPlayerIndex].chips) {
      console.log('too much');
      return false;
    }
    if (raiseAmount < 4) { // TODO should be big blind, will have to bring in big blind as a part of state
      console.log('not enough')
      return false;
    }
    return true;
  }

  const checkHandler = () => {
    const response = cCheckHandler();
    stateUpdate(response);
  }

  const callHandler = () => {
    const response = cCallHandler();
    stateUpdate(response);
  }

  const foldHandler = () => {
    const response = cFoldHandler();
    stateUpdate(response);
  }

  const declareWinner = (winners: Player[]) => {
    // This will be a FE function that plays some animation declaring winner
    // DO NOT do any player logic here. This will all be done in the BE
    console.log('winners', winners);
  }

  // TODO probably going to lead to a bug if one of these players is busted
  // Likely need to replicate how it's done in model

  const getBlindIndex = (startIndex: number) => {
    let index = startIndex;
    do {
      index = (index + 1) % players.length;
    } while (players[index].busted || players[index].folded);

    return index;
  }

  const stateUpdate = (response: reponse) => {
    setTableCards(response.tableCards);
    setGameState(response.gamestate);
    setCurrentPlayerIndex(response.currentPlayerIndex);
    setPot(response.pot);
    setCurrentBet(response.currentBet);
    setRaiseInput(4) // TODO make this big blind, not 4
    if (response.gamestate === 'end') {
      declareWinner(response.winners);
    }
  }

  return (
    <>
      <div className="gameWrapper">
        {
          gameState === 'none' &&
          <div className='drawBtn'>
            <button className='btn' onClick={drawHandler}>
              Draw Cards
            </button>
            {/* <button className='btn' onClick={testDraw}>
              Test Cards
            </button> */}
          </div>
        }
        {
          (gameState === 'preflop' || gameState === 'flop' || gameState === 'turn' || gameState === 'river') &&
          <div className='drawBtn'>
            <span>{(players[currentPlayerIndex]?.name ?? '')}</span>
            <span>total chips: {players[currentPlayerIndex]?.chips || 0}</span>
            <span>pot: {pot}</span>
            <span>Player Bet: {players[currentPlayerIndex].currentBet}</span>
            <input type="number" value={raiseInput} onChange={(e) => setRaiseInput(parseInt(e.target.value))}/>
            <button className='btn' onClick={raiseHandler}>
              Raise
            </button>
            {
              players[currentPlayerIndex].currentBet === currentBet &&
              <button className='btn' onClick={checkHandler}>
                Check
              </button>
            }
            {
              players[currentPlayerIndex].currentBet < currentBet &&
              // players[currentPlayerIndex].chips + players[currentPlayerIndex].currentBet >= currentBet &&
              <button className='btn' onClick={callHandler}>
                Call
              </button>
            }
            {
              players[currentPlayerIndex].chips !== 0 &&
              <button className='btn' onClick={allInHandler}>
                All In
              </button>
            }
            {
              players[currentPlayerIndex].chips === 0 &&
              <button className='btn' onClick={checkHandler}>
                Skip
              </button>
            }
            <button className='btn' onClick={foldHandler}>
              Fold
            </button>
          </div>
         
        }
        {
          gameState === 'end' &&
          <div className='drawBtn'>
            <button className='btn' onClick={drawHandler}>
              Start Round
            </button>
            {/* <button className='btn' onClick={testDraw}>
              Test Cards
            </button> */}
          </div>
        }
        <div className="table">
          <img src={table1} alt="table" />

          <p className='gameState'>
            Total Pot: {pot.toLocaleString()} &nbsp;|&nbsp; {gameState}
          </p>

          <div className='tableCards'>
            {
              tableCards.map(card => (
                <CardFront card={card} />
              ))
            }
          </div>

          {
            players.map((player, index) => {
              const hand = player.getHand();
              if (hand.length === 0) {
                return;
              }
              return (
                <div className={`playerHand player${index + 1}${player.folded ? ' folded' : ''}`} key={`playerHand-${index+1}`}>
                  <div className='cardWrapper'>
                    <CardFront card={hand[0] || null} />
                    <CardFront card={hand[1] || null} />
                  </div>
                  <div className={`playerHandName${index === currentPlayerIndex ? ' active' : ''}`}>
                    <span className='name'>{player.name}</span>
                    <hr />
                    <span className='chips'>{player.chips.toLocaleString()}</span>
                  </div>
                  {
                    index === dealerIndex &&
                    <span className="pin dealer">Dealer</span>
                  }
                  {
                    index === getBlindIndex(dealerIndex) &&
                    <span className="pin smallBlind">Small</span>
                  }
                  {
                    index === getBlindIndex(dealerIndex + 1) &&
                    <span className="pin bigBlind">Big</span>
                  }
                </div>
              );
            })
          }

        </div>
      </div>
    </>
  )

}

export default GameView;