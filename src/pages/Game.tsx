import table1 from '../assets/table1.png';
import './Game.css';
import CardFront from './CardFront';
import Card from '../models/Card';
import Player from '../models/Player';
import { contestHands, dealCards, testDealCards, drawCard, getHandRanking } from '../controllers/game'
import { useState } from 'react';

const Game = () => {

  type states = 'none' | 'preflop' | 'flop' | 'turn' | 'river';
  const handOrder = ['highCard', 'pair', 'twoPair', 'threeOfAKind', 'straight', 'flush', 'fullHouse', 'fourOfAKind', 'straightFlush', 'royalFlush'];

  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<states>('none');
  const [currentPlayer, setCurrentPlayer] = useState<Player>(players[0] || null);
  const [pot, setPot] = useState<number>(0);
  const [lastRaisePlayer, setLastRaisePlayer] = useState<Player>(players[0] || null); // last player who raised
  const [tableCards, setTableCards] = useState<Card[]>([]);
  const [dealerIndex, setDealerIndex] = useState<number>(0);
  const [smallBlind, setSmallBlind] = useState<number>(2);
  const [bigBlind, setBigBlind] = useState<number>(4);
  const [currentBet, setCurrentBet] = useState<number>(bigBlind); // big blind
  // const [currentRaise, setCurrentRaise] = useState<number>(0);
  const [betInput, setBetInput] = useState<number>(currentBet);
  
  const drawHandler = () => {
    const players = dealCards();
    setPlayers(players);
    setGameState('preflop');
    setDealerIndex(dealerIndex);
    setSmallBlind(smallBlind);
    setBigBlind(bigBlind);
    setCurrentBet(bigBlind);
    setPot(pot + smallBlind + bigBlind);
    setCurrentPlayer(players[dealerIndex + 3]);
    console.log('🚀 ~ drawHandler ~ dealerIndex:', dealerIndex);
    setLastRaisePlayer(players[dealerIndex + 3]);
    players[dealerIndex + 1].setCurrentBet(smallBlind);
    players[dealerIndex + 1].setChips(players[dealerIndex + 1].chips - smallBlind);
    players[dealerIndex + 2].setCurrentBet(bigBlind);
    players[dealerIndex + 2].setChips(players[dealerIndex + 2].chips - bigBlind);
  }

  const testDraw = () => {
    const players = testDealCards();
    setPlayers(players);
    // setGameState('preflop');
    setDealerIndex(0);
    setSmallBlind(2);
    setBigBlind(4);
    setPot(pot + smallBlind + bigBlind);
    setCurrentPlayer(players[dealerIndex + 3]);
    setLastRaisePlayer(players[dealerIndex + 3]);
    players[dealerIndex + 1].setCurrentBet(smallBlind);
    players[dealerIndex + 1].setChips(players[dealerIndex + 1].chips - smallBlind);
    players[dealerIndex + 2].setCurrentBet(bigBlind);
    players[dealerIndex + 2].setChips(players[dealerIndex + 2].chips - bigBlind);

    setPlayers(players);

    setGameState('river');
    const card1:Card = new Card('10', 'hearts')
    const card2:Card = new Card('9', 'hearts')
    const card3:Card = new Card('8', 'hearts')
    const card4:Card = new Card('2', 'hearts')
    const card5:Card = new Card('9', 'clubs')
    setTableCards([card1, card2, card3, card4, card5]);
    // updateRoundState();
    const finalHands = players.map(player => ({ ...getHandRanking(player, [card1, card2, card3, card4, card5]) }));
    finalHands.sort((a, b) => {
      const handA = handOrder.indexOf(a.highestHand);
      const handB = handOrder.indexOf(b.highestHand);
      
      return handB - handA;
    });
    
    const highestHand = finalHands[0].highestHand;
    const highestPlayers = finalHands.filter(hand => hand.highestHand === highestHand);
    const winners = contestHands(highestPlayers);
    console.log('winners!!', winners);
  }

  const raiseHandler = () => {
    if (betInput > currentPlayer.chips) {
      console.error('too much!');
      return;
    }
    if (betInput < bigBlind) {
      console.error('not enough!');
      return;
    }

    if (currentPlayer.currentBet < currentBet) {
      // make player call before raising
      const call = currentBet - currentPlayer.currentBet;
      currentPlayer.setCurrentBet(call);
      currentPlayer.setChips(currentPlayer.chips - call);
    }

    setLastRaisePlayer(currentPlayer);
    setCurrentBet(currentBet + betInput);
    currentPlayer.setCurrentBet(betInput);
    currentPlayer.setChips(currentPlayer.chips - betInput);
    setPot(pot + betInput);

    nextPlayersTurn();
  }

  const callHandler = () => {
    const call = currentBet - currentPlayer.currentBet;
    currentPlayer.setCurrentBet(call);
    currentPlayer.setChips(currentPlayer.chips - call);
    setPot(pot + call);

    checkNextPlayer();
  }

  const checkHandler = () => {
    checkNextPlayer();
  }

  const checkNextPlayer = () => {
    const currentIndex = players.findIndex(player => player.name === currentPlayer.name);
    const nextPlayer = currentIndex + 1 > players.length - 1 ? players[0] : players[currentIndex + 1];
    if (lastRaisePlayer.name === nextPlayer.name) {
      // reset round
      updateRoundState();
    } else {
      nextPlayersTurn();
    }
  }

  const nextPlayersTurn = () => {
    let currentIndex = players.findIndex(player => player.name === currentPlayer.name);

    while ((players[currentIndex + 1] ?? players[0]).folded === true) {
      // cyclye until we find a player not folded
      if (currentIndex >= players.length - 1) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
    }

    if (currentIndex >= players.length - 1) {
      setCurrentPlayer(players[0]);
    } else {
      setCurrentPlayer(players[currentIndex + 1]);
    }
  }

  const getLeftOfDealer = () => {
    setCurrentPlayer(players[dealerIndex + 1]);
    setLastRaisePlayer(players[dealerIndex + 1]);
  }

  const foldHandler = () => {
    currentPlayer.SetFolded(true);
    const nonFoldedPlayers = players.filter(player => !player.folded);
    if (nonFoldedPlayers.length === 1) {
      declareWinner(nonFoldedPlayers);
      return;
    }
    checkNextPlayer();
  }

  const updateRoundState = () => {
    if (gameState === 'preflop') {
      setGameState('flop');
      drawCard(); // burn card
      const flopCard1 = drawCard();
      const flopCard2 = drawCard();
      const flopCard3 = drawCard();
      setTableCards([flopCard1, flopCard2, flopCard3]);
      getLeftOfDealer();

    } else if (gameState === 'flop') {
      setGameState('turn');
      drawCard(); // burn card
      const turnCard = drawCard();
      setTableCards([...tableCards, turnCard]);
      getLeftOfDealer();

    } else if (gameState === 'turn') {
      setGameState('river');
      drawCard(); // burn card
      const riverCard = drawCard();
      setTableCards([...tableCards, riverCard]);
      getLeftOfDealer();

    } else {
      const finalHands = players.map(player => ({ ...getHandRanking(player, tableCards) }));
      finalHands.sort((a, b) => {
        const handA = handOrder.indexOf(a.highestHand);
        const handB = handOrder.indexOf(b.highestHand);
        
        return handB - handA;
      });
      
      const highestHand = finalHands[0].highestHand;
      const highestPlayers = finalHands.filter(hand => hand.highestHand === highestHand);
      const winners = contestHands(highestPlayers);
      declareWinner(winners.map(winner => winner.player));

    }
  }

  const declareWinner = (winners: Player[]) => {
    if (winners.length === 0) {
      console.error('Got 0 winners')
      return;
    }
    if (winners.length === 1) {
      console.log('winner!!', winners[0]);
    } else {
      console.log('winners!!', winners);
    }

    winners.map(winner => {
      const dividedPot =Math.round(pot / winners.length)
      winner.setChips(winner.chips + dividedPot);
    });

    console.log('winners', winners);

    startNextRound();
  }

  const startNextRound = () => {
    const newDealerIndex = dealerIndex === players.length - 1 ? 0 : dealerIndex + 1;
    setDealerIndex(newDealerIndex);
    setCurrentBet(bigBlind);
    setPot(0);
    setTableCards([]);;
    drawHandler();
    players.forEach(player => {
      player.SetFolded(false);
      player.currentBet = 0;
    });
    // setPlayers(newPlayers);
  }


  return (
    <>
      <div className="gameWrapper">
        <p>
          Game State: {gameState} <br />
          Current Bet: {currentBet} <br />
        </p>
        {
          gameState === 'none' &&
          <div className='drawBtn'>
            <button className='btn' onClick={drawHandler}>
              Draw Cards
            </button>
            <button className='btn' onClick={testDraw}>
              Test Cards
            </button>
          </div>
        }
        {
          (gameState === 'preflop' || gameState === 'flop' || gameState === 'turn' || gameState === 'river') &&
          <div className='drawBtn'>
            <span>{(currentPlayer?.name ?? '')}</span>
            <span>total chips: {currentPlayer?.chips || 0}</span>
            <span>pot: {pot}</span>
            <input type="number" value={betInput} onChange={(e) => setBetInput(parseInt(e.target.value))}/>
            <button className='btn' onClick={raiseHandler}>
              Raise
            </button>
            {
              currentPlayer.currentBet === currentBet &&
              <button className='btn' onClick={checkHandler}>
                Check
              </button>
            }
            {
              currentPlayer.currentBet < currentBet &&
              <button className='btn' onClick={callHandler}>
                Call
              </button>
            }
            <button className='btn' onClick={foldHandler}>
              Fold
            </button>
          </div>
         
        }
        <div className="table">
          <img src={table1} alt="table" />

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
              return (
                <div className={`playerHand player${index + 1}`} key={`playerHand-${index+1}`}>
                  <CardFront card={hand[0] || null} />
                  <CardFront card={hand[1] || null} />
                  <span className='playerHandName'>{player.name}</span>
                  {
                    index === dealerIndex &&
                    <span className="pin dealer">Dealer</span>
                  }
                  {
                    index === dealerIndex + 1 &&
                    <span className="pin smallBlind">Small</span>
                  }
                  {
                    index === dealerIndex + 2 &&
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

export default Game;

