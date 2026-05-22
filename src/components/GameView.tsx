import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Game.css';
import './MobileGame.css';
import CardFront from './CardFront';
import CardBack from './CardBack';
import table1 from '../assets/table1.png';
import { initGame } from '../controllers/gameService';
import type { GameState, PlayerState } from '../types/GameState';
import WinnerPopup from './WinnerPopup';
import { SocketContext } from '../contexts/SocketContext';

const GameView = () => {
  const { socket, connect } = useContext(SocketContext);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { roomCode: stateRoomCode, playerId: statePlayerId, isHost } = (state ?? {}) as { roomCode?: string; playerId?: string; isHost?: boolean };
  const roomCode = stateRoomCode ?? sessionStorage.getItem('poker_roomCode') ?? '';
  const myPlayerId = statePlayerId ?? sessionStorage.getItem('poker_playerId') ?? '';
  void isHost;

  const [game, setGame] = useState<GameState>(initGame());
  const [raiseInput, setRaiseInput] = useState<number>(0);
  const [expandedSeat, setExpandedSeat] = useState<number | null>(0);
  const [expandedTableCards, setExpandedTableCards] = useState(false);

  const { players, tableCards, pot, currentBet, currentPlayerIndex, dealerIndex, phase } = game;

  useEffect(() => {
    const activeSocket = socket ?? connect();

    activeSocket.emit('initGame', { roomCode });

    activeSocket.on('gameInitialized', ({ gameState }: { gameState: GameState }) => {
      setGame(gameState);
      setRaiseInput(gameState.bigBlind);
    });

    activeSocket.on('roundStarted', ({ gameState }: { gameState: GameState }) => {
      setGame(gameState);
      setRaiseInput(gameState.bigBlind);
    });

    activeSocket.on('gameUpdated', ({ gameState }: { gameState: GameState }) => {
      setGame(gameState);
    });

    return () => {
      activeSocket.off('gameInitialized');
      activeSocket.off('roundStarted');
      activeSocket.off('gameUpdated');
    };
  }, [socket, roomCode, connect]);

  const handleDisconnect = () => {
    const playerId = sessionStorage.getItem('poker_playerId') ?? '';
    socket?.emit('leaveRoom', { roomCode, playerId });
    navigate('/');
  };

  const drawHandler = () => socket?.emit('startRound', { roomCode });
  const handleRaise = () => socket?.emit('raise', { roomCode, betAmount: raiseInput });
  const handleAllIn = () => socket?.emit('allIn', { roomCode });
  const handleCheck = () => socket?.emit('check', { roomCode });
  const handleCall  = () => socket?.emit('call', { roomCode });
  const handleFold  = () => socket?.emit('fold', { roomCode });

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
    return players.reduce((count, player) => player.status === 'busted' ? count : count + 1, 0);
  };

  const inActivePhase =
    phase === 'preflop' || phase === 'flop' || phase === 'turn' || phase === 'river';

  const activePlayers = players.filter(p => p.status !== 'busted');
  const gameWinner = activePlayers.length === 1 ? activePlayers[0] : null;

  const myIndex = players.findIndex(p => p.id === myPlayerId);
  const isMyTurn = myIndex !== -1 && myIndex === currentPlayerIndex;
  const isAllIn = isMyTurn && players[myIndex]?.chips === 0 && players[myIndex]?.status !== 'busted' && players[myIndex]?.status !== 'folded';

  useEffect(() => {
    if (!isAllIn) return;
    const timeout = setTimeout(() => handleCheck(), 1000);
    return () => clearTimeout(timeout);
  }, [isAllIn]);

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
          const isMe       = index === myIndex;
          const isExpanded = expandedSeat === index;

          return (
            <div
              className={`mobile-seat mobile-seat-${index + 1}${isFolded ? ' folded' : ''}${isExpanded ? ' expanded' : ''}`}
              key={index}
              onClick={() => isMe && player.hand.length > 0 && toggleExpand(index)}
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
                    {isMe
                      ? <><CardFront card={player.hand[0]} /><CardFront card={player.hand[1]} /></>
                      : <><CardBack /><CardBack /></>
                    }
                  </div>
                )}
              </div>

              {index === dealerIndex && <span className="pin dealer">D</span>}
              {howManyActivePlayers(players) === 2 && index === dealerIndex && <span className="pin smallBlind">SB</span>}
              {howManyActivePlayers(players) === 2 && index === getNextActivePlayer(dealerIndex) && <span className="pin bigBlind">BB</span>}
              {howManyActivePlayers(players) > 2 && index === getNextActivePlayer(dealerIndex) && <span className="pin smallBlind">SB</span>}
              {howManyActivePlayers(players) > 2 && index === getNextActivePlayer(getNextActivePlayer(dealerIndex)) && <span className="pin bigBlind">BB</span>}
            </div>
          );
        })}
      </div>

      <div className="mobile-actions">
        <button className="btn btn-secondary" onClick={handleDisconnect}>Leave</button>

        {(phase === 'waiting' || phase === 'end') && myIndex !== -1 && myIndex === dealerIndex && (
          <button className="btn mobile-full-btn" onClick={drawHandler}>
            {phase === 'waiting' ? 'Deal Cards' : 'Next Round'}
          </button>
        )}

        {inActivePhase && isMyTurn && !isAllIn && (
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
              {players[currentPlayerIndex].currentBet === currentBet &&
                <button className="btn" onClick={handleCheck}>Check</button>
              }
              {players[currentPlayerIndex].currentBet < currentBet &&
                <button className="btn" onClick={handleCall}>Call</button>
              }
              {players[currentPlayerIndex].chips !== 0 &&
                <button className="btn" onClick={handleAllIn}>All In</button>
              }
              {players[currentPlayerIndex].chips === 0 &&
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
