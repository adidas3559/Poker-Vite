import { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Game.css';
import './MobileGame.css';
import CardFront from './CardFront';
import CardBack from './CardBack';
import table1 from '../assets/table1.png';
import { initGame } from '../controllers/gameService';
import type { GameState, PlayerState } from '../types/GameState';
import WinnerPopup from './WinnerPopup';
import Chip from './Chip';
import { SocketContext } from '../contexts/SocketContext';

const CHIP_OFFSETS = [
  { x: 0,   y: 0,   r: 0  },
  { x: -14, y: -8,  r: 6  },
  { x: 12,  y: -10, r: -4 },
  { x: -16, y: 10,  r: 8  },
  { x: 14,  y: 12,  r: -5 },
  { x: 2,   y: -18, r: 3  },
  { x: -6,  y: 16,  r: -7 },
  { x: 18,  y: 2,   r: 5  },
];

type VictoryChip = { id: number; startX: number; startY: number; endX: number; endY: number; delay: number; };

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
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [isDealing, setIsDealing] = useState(false);
  const [roundKey, setRoundKey] = useState(0);
  const [dealingTableFrom, setDealingTableFrom] = useState<number | null>(null);
  const [victoryChips, setVictoryChips] = useState<VictoryChip[]>([]);
  const [hiddenBetIndices, setHiddenBetIndices] = useState<number[]>([]);
  const [displayedDealerIndex, setDisplayedDealerIndex] = useState(0);
  const prevTableCardCount = useRef(0);
  const gameRef = useRef<GameState>(initGame());
  const nameplateRefs = useRef<(HTMLDivElement | null)[]>([]);
  const betIndicatorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [expandedSeat, setExpandedSeat] = useState<number | null>(0);
  const [expandedTableCards, setExpandedTableCards] = useState(false);

  const { players, tableCards, pot, currentBet, currentPlayerIndex, dealerIndex, phase, bigBlind } = game;

  useEffect(() => {
    const activeSocket = socket ?? connect();

    activeSocket.emit('initGame', { roomCode });

    activeSocket.on('gameInitialized', ({ gameState }: { gameState: GameState }) => {
      gameRef.current = gameState;
      setGame(gameState);
      setRaiseInput(gameState.bigBlind);
    });

    activeSocket.on('roundStarted', ({ gameState }: { gameState: GameState }) => {
      gameRef.current = gameState;
      setGame(gameState);
      setRaiseInput(gameState.bigBlind);
      setIsDealing(true);
      setRoundKey(k => k + 1);
      setHiddenBetIndices([]);
      setDisplayedDealerIndex(gameState.dealerIndex);
    });

    activeSocket.on('gameUpdated', ({ gameState }: { gameState: GameState }) => {
      console.log('🚀 ~ gameUpdated ~ gameState:', gameState);
      
      // Capture chip pile positions before React can unmount them
      if (gameState.phase === 'end' && gameState.winners.length > 0 && gameRef.current.phase !== 'end') {
        const mainWinner = Array.isArray(gameState.winners[0])
          ? gameState.winners[0][0]
          : gameState.winners[0] as PlayerState;
        const winnerIdx = gameState.players.findIndex(p => p.id === mainWinner.id);
        const nameplateEl = nameplateRefs.current[winnerIdx];

        if (nameplateEl) {
          const nameRect = nameplateEl.getBoundingClientRect();
          const toCX = nameRect.left + nameRect.width / 2;
          const toCY = nameRect.top + nameRect.height / 2;

          const chips: VictoryChip[] = [];

          gameRef.current.players.forEach((player, idx) => {
            if (player.currentBet <= 0 || player.status === 'busted') return;
            const betEl = betIndicatorRefs.current[idx];
            if (!betEl) return;

            const betRect = betEl.getBoundingClientRect();
            const fromCX = betRect.left + betRect.width / 2;
            const fromCY = betRect.top + betRect.height / 2;

            const chipCount = Math.min(8, Math.max(1, Math.ceil(player.currentBet / 2)));
            for (let i = 0; i < chipCount; i++) {
              const off = CHIP_OFFSETS[i % CHIP_OFFSETS.length];
              chips.push({
                id: chips.length,
                startX: fromCX + off.x - 18,
                startY: fromCY + off.y - 18,
                endX: toCX - 18,
                endY: toCY - 18,
                delay: chips.length * 0.05,
              });
            }
          });

          if (chips.length > 0) {
            const toHide = gameRef.current.players
              .map((p, idx) => (p.currentBet > 0 && betIndicatorRefs.current[idx] ? idx : -1))
              .filter(idx => idx >= 0);
            setHiddenBetIndices(toHide);
            setVictoryChips(chips);
            setTimeout(() => {
              setVictoryChips([]);
            }, 1600);
          }
        }
      }

      gameRef.current = gameState;
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
  const myChips = myIndex !== -1 ? players[myIndex].chips : 0;
  const relativeSeat = (index: number) =>
    myIndex === -1 ? index + 1 : ((index - myIndex + players.length) % players.length) + 1;
  const numDealt = players.filter(p => p.status !== 'busted').length;
  const isMyTurn = myIndex !== -1 && myIndex === currentPlayerIndex;
  const isAllIn = isMyTurn && players[myIndex]?.chips === 0 && players[myIndex]?.status !== 'busted' && players[myIndex]?.status !== 'folded';
  console.log('🚀 ~ GameView ~ isAllIn:', isAllIn);

  useEffect(() => {
    if (!isAllIn || !isMyTurn) return;
    const timeout = setTimeout(() => handleCheck(), 1000);
    return () => clearTimeout(timeout);
  }, [isMyTurn, phase]);

  useEffect(() => {
    if (!isDealing) return;
    const timeout = setTimeout(() => setIsDealing(false), 2500);
    return () => clearTimeout(timeout);
  }, [isDealing]);

  useEffect(() => {
    const prev = prevTableCardCount.current;
    const curr = tableCards.length;
    prevTableCardCount.current = curr;
    if (curr <= prev) return;
    setDealingTableFrom(prev);
    const timeout = setTimeout(() => setDealingTableFrom(null), 2000);
    return () => clearTimeout(timeout);
  }, [tableCards.length]);

  return (
    <>
    {gameWinner && <WinnerPopup winner={gameWinner} />}
    <button className="back-btn" onClick={handleDisconnect}>← Leave</button>

    {victoryChips.map(chip => (
      <div
        key={chip.id}
        className="victory-chip"
        style={{
          left: chip.startX,
          top: chip.startY,
          '--v-dx': `${chip.endX - chip.startX}px`,
          '--v-dy': `${chip.endY - chip.startY}px`,
          '--v-delay': `${chip.delay}s`,
        } as React.CSSProperties}
      />
    ))}

    {showRaiseModal && (
      <div className="raise-modal-overlay" onClick={() => setShowRaiseModal(false)}>
        <div className="raise-modal" onClick={e => e.stopPropagation()}>
          <p className="raise-modal-label">Raise Amount</p>
          <p className="raise-modal-value">{raiseInput.toLocaleString()}</p>
          <div className="raise-modal-stepper">
            <button className="raise-stepper-btn" onClick={() => setRaiseInput(v => Math.max(bigBlind, v - 1))}>−</button>
            <input
              className="raise-slider"
              type="range"
              min={bigBlind}
              max={myChips}
              value={raiseInput}
              onChange={e => setRaiseInput(parseInt(e.target.value))}
            />
            <button className="raise-stepper-btn" onClick={() => setRaiseInput(v => Math.min(myChips, v + 1))}>+</button>
          </div>
          <button className="btn" onClick={() => setShowRaiseModal(false)}>Done</button>
        </div>
      </div>
    )}
    <div className="mobile-wrapper">

      <div className="mobile-table-area">
        <img className="mobile-table-img" src={table1} alt="table" />

        <div
          className={`mobile-center-info ${expandedTableCards ? ' expanded' : ''}`}
          onClick={() => tableCards.length > 0 && setExpandedTableCards(p => !p)}
        >
          <div className="mobile-community-cards">
            {tableCards.map((card, i) => {
              const isNew = dealingTableFrom !== null && i >= dealingTableFrom;
              return (
                <div
                  key={i}
                  className={isNew ? 'table-card-dealing' : undefined}
                  style={isNew ? { '--table-card-delay': `${(i - dealingTableFrom) * 0.2}s` } as React.CSSProperties : undefined}
                >
                  <CardFront card={card} />
                </div>
              );
            })}
          </div>
          <div className="mobile-pot-info">
            <span className='pot'>Pot: {pot.toLocaleString()}</span>
            <span className='phase'>{phase}</span>
            <span className='phase'>Current Bet: {currentBet}</span>
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
              className={`mobile-seat mobile-seat-${relativeSeat(index)}${isFolded ? ' folded' : ''}${isExpanded ? ' expanded' : ''}`}
              style={isMe ? { zIndex: 20 } : undefined}
              key={index}
              onClick={() => isMe && player.hand.length > 0 && toggleExpand(index)}
            >
              <div className='mobile-nameplateWrapper'>
                <div
                  className={`mobile-nameplate${isActive ? ' active' : ''}`}
                  ref={el => { nameplateRefs.current[index] = el; }}
                >
                  <span className="m-name">{player.name}</span>
                  <span className="m-chips">{player.chips.toLocaleString()}</span>
                </div>

                {player.currentBet > 0 && (
                  <div
                    key={roundKey}
                    className="mobile-bet-indicator"
                    ref={el => { betIndicatorRefs.current[index] = el; }}
                    style={hiddenBetIndices.includes(index) ? { visibility: 'hidden' } : undefined}
                  >
                    <span className="bet-amount">{player.currentBet.toLocaleString()}</span>
                    <div className="chip-pile">
                      {Array.from({ length: Math.min(8, Math.max(1, Math.ceil(player.currentBet / 2))) }).map((_, i) => {
                        const off = CHIP_OFFSETS[i % CHIP_OFFSETS.length];
                        return (
                          <div
                            key={i}
                            className="chip-in-pile"
                            style={{
                              '--pile-x': `${off.x}px`,
                              '--pile-y': `${off.y}px`,
                              '--pile-r': `${off.r}deg`,
                              '--chip-anim-delay': `${i * 0.08}s`,
                            } as React.CSSProperties}
                          >
                            <Chip />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {player.hand.length > 0 && (
                  <div
                    className={`mobile-card-wrapper${isDealing ? ' dealing' : ''}`}
                    style={isDealing ? {
                      '--card1-delay': `${(relativeSeat(index) - 1) * 0.18}s`,
                      '--card2-delay': `${(numDealt + relativeSeat(index) - 1) * 0.18}s`,
                    } as React.CSSProperties : undefined}
                  >
                    {isMe
                      ? <><CardFront card={player.hand[0]} /><CardFront card={player.hand[1]} /></>
                      : <><CardBack /><CardBack /></>
                    }
                  </div>
                )}
              </div>

              <div className="pin-wrapper">
                {index === displayedDealerIndex && <span className="pin dealer">D</span>}
                {howManyActivePlayers(players) === 2 && index === displayedDealerIndex && <span className="pin smallBlind">SB</span>}
                {howManyActivePlayers(players) === 2 && index === getNextActivePlayer(displayedDealerIndex) && <span className="pin bigBlind">BB</span>}
                {howManyActivePlayers(players) > 2 && index === getNextActivePlayer(displayedDealerIndex) && <span className="pin smallBlind">SB</span>}
                {howManyActivePlayers(players) > 2 && index === getNextActivePlayer(getNextActivePlayer(displayedDealerIndex)) && <span className="pin bigBlind">BB</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mobile-actions">
        {(phase === 'waiting' || phase === 'end') && myIndex !== -1 && myIndex === dealerIndex && (
          <button className="btn mobile-full-btn" onClick={drawHandler}>
            {phase === 'waiting' ? 'Deal Cards' : 'Next Round'}
          </button>
        )}

        {inActivePhase && isMyTurn && !isAllIn && (
          <>
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
              <button className="btn raise-btn" onClick={handleRaise}>
                Raise {raiseInput.toLocaleString()}
              </button>
              <button className="raise-arrow-btn" onClick={() => setShowRaiseModal(true)}>↑</button>
            </div>
          </>
        )}
      </div>

    </div>
    </>
  );
};

export default GameView;
