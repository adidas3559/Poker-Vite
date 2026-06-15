import { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Game.css';
import './MobileGame.css';
import CardFront from './CardFront';
import CardBack from './CardBack';
import { initGame } from '../controllers/gameService';
import type { GameState, PlayerState } from '../types/GameState';
import WinnerPopup from './WinnerPopup';
import Chip from './Chip';
import { SocketContext } from '../contexts/SocketContext';
import { getCharacterById } from '../data/characters';
import { playEmoteSound } from '../utils/emoteSound';

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

const EMOTES = ['😂', '😤', '🤔', '😎', '💀', '🔥', '👑', '💸', '🎰', '🤡'];

const GameView = () => {
  const { socket, connect } = useContext(SocketContext);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { roomCode: stateRoomCode, roomName: stateRoomName, playerId: statePlayerId, isHost, players: statePlayers } = (state ?? {}) as { roomCode?: string; roomName?: string; playerId?: string; isHost?: boolean; players?: { id: string; characterId?: string }[] };
  const roomCode = stateRoomCode ?? sessionStorage.getItem('poker_roomCode') ?? '';
  const myPlayerId = statePlayerId ?? sessionStorage.getItem('poker_playerId') ?? '';
  void isHost;

  const [game, setGame] = useState<GameState>(initGame());
  const [raiseInput, setRaiseInput] = useState<number>(0);
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isDealing, setIsDealing] = useState(false);
  const [roundKey, setRoundKey] = useState(0);
  const [dealingTableFrom, setDealingTableFrom] = useState<number | null>(null);
  const [victoryChips, setVictoryChips] = useState<VictoryChip[]>([]);
  const [hiddenBetIndices, setHiddenBetIndices] = useState<number[]>([]);
  const [displayedDealerIndex, setDisplayedDealerIndex] = useState(0);
  const [roomName, setRoomName] = useState<string>(stateRoomName ?? '');
  const [characterMap, setCharacterMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    statePlayers?.forEach(p => { if (p.characterId) map[p.id] = p.characterId; });
    return map;
  });
  const [disconnectedPlayerIds, setDisconnectedPlayerIds] = useState<Set<string>>(new Set());
  const [disconnectToasts, setDisconnectToasts] = useState<{ id: number; message: string }[]>([]);
  const toastCounterRef = useRef(0);
  const prevTableCardCount = useRef(0);
  const gameRef = useRef<GameState>(initGame());
  const nameplateRefs = useRef<(HTMLDivElement | null)[]>([]);
  const betIndicatorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [expandedSeat, setExpandedSeat] = useState<number | null>(null);
  const [expandedTableCards, setExpandedTableCards] = useState(false);
  const [emotes, setEmotes] = useState<Record<string, { emoji: string; key: number }>>({});
  const [showEmotePicker, setShowEmotePicker] = useState(false);
  const [emoteCooldown, setEmoteCooldown] = useState(false);
  const emoteKeyRef = useRef(0);

  const { players, tableCards, pot, currentBet, currentPlayerIndex, dealerIndex, phase, bigBlind } = game;

  useEffect(() => {
    const activeSocket = socket ?? connect();

    activeSocket.emit('initGame', { roomCode, playerId: myPlayerId });

    // On a hard refresh / rejoin the navigation state (and its character
    // assignments) is gone, so ask the server for the room state. The
    // resulting 'lobbyUpdated' repopulates characterMap below.
    if (!statePlayers || statePlayers.length === 0) {
      activeSocket.emit('rejoinLobby', { roomCode, playerId: myPlayerId });
    }

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

    activeSocket.on('lobbyUpdated', ({ room }: { room: { roomName?: string; players: { id: string; nickname: string; disconnected?: boolean; characterId?: string }[] } }) => {
      if (room.roomName) setRoomName(room.roomName);
      const charMap: Record<string, string> = {};
      room.players.forEach(p => { if (p.characterId) charMap[p.id] = p.characterId; });
      setCharacterMap(charMap);

      setDisconnectedPlayerIds(prev => {
        const next = new Set(room.players.filter(p => p.disconnected).map(p => p.id));
        room.players.forEach(p => {
          if (p.disconnected && !prev.has(p.id)) {
            const toastId = ++toastCounterRef.current;
            setDisconnectToasts(t => [...(t ?? []), { id: toastId, message: `${p.nickname} disconnected` }]);
            setTimeout(() => setDisconnectToasts(t => (t ?? []).filter(x => x.id !== toastId)), 4000);
          }
        });
        return next;
      });
    });

    activeSocket.on('emoteReceived', ({ playerId, emoji }: { playerId: string; emoji: string }) => {
      const key = ++emoteKeyRef.current;
      playEmoteSound(emoji);
      setEmotes(prev => ({ ...prev, [playerId]: { emoji, key } }));
      setTimeout(() => {
        setEmotes(prev => {
          if (prev[playerId]?.key !== key) return prev;
          const next = { ...prev };
          delete next[playerId];
          return next;
        });
      }, 3000);
    });

    return () => {
      activeSocket.off('gameInitialized');
      activeSocket.off('roundStarted');
      activeSocket.off('gameUpdated');
      activeSocket.off('lobbyUpdated');
      activeSocket.off('emoteReceived');
    };
  }, [socket, roomCode, connect, myPlayerId, statePlayers]);

  const handleDisconnect = () => {
    const playerId = sessionStorage.getItem('poker_playerId') ?? '';
    socket?.emit('leaveRoom', { roomCode, playerId });
    navigate('/');
  };

  const drawHandler = () => socket?.emit('startRound', { roomCode });
  const handleRaise = () => socket?.emit('raise', { roomCode, betAmount: raiseInput });
  // const handleAllIn = () => socket?.emit('allIn', { roomCode });
  const handleCheck = () => socket?.emit('check', { roomCode });
  const handleCall  = () => socket?.emit('call', { roomCode });
  const handleFold  = () => socket?.emit('fold', { roomCode });
  const EMOTE_COOLDOWN_MS = 5000;
  const handleEmote = (emoji: string) => {
    if (emoteCooldown) return;
    socket?.emit('emote', { roomCode, playerId: myPlayerId, emoji });
    setShowEmotePicker(false);
    setEmoteCooldown(true);
    setTimeout(() => setEmoteCooldown(false), EMOTE_COOLDOWN_MS);
  };

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

  const clampRaise = (value: number) => Math.max(bigBlind, Math.min(myChips, value));

  const confirmRaise = () => {
    // if (raiseInput >= myChips) handleAllIn();
    // else handleRaise();
    handleRaise();
    setShowRaiseModal(false);
  };

  const myToCall = myIndex !== -1 ? Math.max(0, currentBet - players[myIndex].currentBet) : 0;
  const showDealBtn = (phase === 'waiting' || phase === 'end') && myIndex !== -1 && myIndex === dealerIndex;
  const showActionBtns = inActivePhase && isMyTurn && !isAllIn;

  return (
    <>
    {gameWinner && <WinnerPopup winner={gameWinner} players={players} characterMap={characterMap} />}

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
          <div className="raise-handle" />
          <p className="raise-modal-label">Raise to</p>
          <p className="raise-modal-value">{raiseInput.toLocaleString()}</p>
          <input
            className="raise-slider"
            type="range"
            min={bigBlind}
            max={myChips}
            step={2}
            value={raiseInput}
            onChange={e => setRaiseInput(parseInt(e.target.value))}
          />
          <div className="raise-presets">
            <button className="raise-preset" onClick={() => setRaiseInput(clampRaise(bigBlind))}>Min</button>
            <button className="raise-preset" onClick={() => setRaiseInput(clampRaise(Math.round(pot / 2)))}>½ Pot</button>
            <button className="raise-preset" onClick={() => setRaiseInput(clampRaise(pot))}>Pot</button>
            <button className="raise-preset" onClick={() => setRaiseInput(myChips)}>Max</button>
          </div>
          <div className="raise-actions">
            <button className="raise-cancel" onClick={() => setShowRaiseModal(false)}>Cancel</button>
            <button className="raise-confirm" onClick={confirmRaise}>
              {raiseInput >= myChips ? 'All In' : `Raise ${raiseInput.toLocaleString()}`}
            </button>
          </div>
        </div>
      </div>
    )}

    {showLeaveConfirm && (
      <div className="confirm-overlay" onClick={() => setShowLeaveConfirm(false)}>
        <div className="confirm-modal" onClick={e => e.stopPropagation()}>
          <p className="confirm-title">Leave Table?</p>
          <p className="confirm-text">You'll be removed from this hand and forfeit any chips in the pot.</p>
          <div className="confirm-actions">
            <button className="confirm-cancel" onClick={() => setShowLeaveConfirm(false)}>Stay</button>
            <button className="confirm-leave" onClick={handleDisconnect}>Leave</button>
          </div>
        </div>
      </div>
    )}

    <div className="disconnect-toasts">
      {disconnectToasts.map(toast => (
        <div key={toast.id} className="disconnect-toast">{toast.message}</div>
      ))}
    </div>

    <div className="mobile-wrapper">

      <div className="game-topbar">
        <button className="leave-btn" onClick={() => setShowLeaveConfirm(true)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#e9c766" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          Leave
        </button>
        <div className="topbar-title">
          <div className="table-name">{roomName || 'The Gold Spur'}</div>
          <div className="table-sub">{roomCode ? `Room ${roomCode}` : 'Table VII'}</div>
        </div>
        {/* <div className="topbar-blinds">
          <span className="blinds-label">Blinds</span>
          <span className="blinds-value">{smallBlind} / {bigBlind}</span>
        </div> */}
      </div>

      <div className="mobile-table-area">
        <div className="felt-table">
          <div className="felt-surface">
            <div className="felt-ring" />
          </div>
        </div>

        <div
          className={`mobile-center-info${expandedTableCards ? ' expanded' : ''}`}
          onClick={() => tableCards.length > 0 && setExpandedTableCards(p => !p)}
        >
          <div className="pot-pill">
            <svg width="15" height="15" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#d5aa49" stroke="#8a6a2a" strokeWidth="2" /><text x="16" y="21" textAnchor="middle" fontFamily="Playfair Display,serif" fontWeight="900" fontSize="13" fill="#5c3f12">$</text></svg>
            <span className="pot-amount">POT {pot.toLocaleString()}</span>
          </div>
          {inActivePhase && <div className="phase-label">— {phase} —</div>}
          <div className="mobile-community-cards">
            {Array.from({ length: 5 }).map((_, i) => {
              const card = tableCards[i];
              if (!card) return <div key={i} className="table-card-slot empty" />;
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
          {inActivePhase && myToCall > 0 && (
            <div className="to-call">To call · <b>{myToCall.toLocaleString()}</b></div>
          )}
        </div>

        {players.map((player, index) => {
          if (player.status === 'busted') return null;
          const isActive       = index === currentPlayerIndex;
          const isFolded       = player.status === 'folded';
          const isMe           = index === myIndex;
          const isExpanded     = expandedSeat === index;
          const isDisconnected = disconnectedPlayerIds.has(player.id);
          const charId         = characterMap[player.id];
          const char           = charId ? getCharacterById(charId) : undefined;

          return (
            <div
              className={`mobile-seat mobile-seat-${relativeSeat(index)}${isActive ? ' active' : ''}${isFolded ? ' folded' : ''}${isExpanded ? ' expanded' : ''}${isDisconnected ? ' disconnected' : ''}`}
              key={index}
              onClick={() => isMe && player.hand.length > 0 && toggleExpand(index)}
            >
              <div className="mobile-nameplateWrapper">
                {emotes[player.id] && (
                  <div key={emotes[player.id].key} className="emote-bubble">
                    {emotes[player.id].emoji}
                  </div>
                )}

                <div
                  className="seat-avatar"
                  ref={el => { nameplateRefs.current[index] = el; }}
                >
                  {char
                    ? <img src={char.img} alt={char.name} />
                    : <div className="seat-avatar-fallback">{player.name?.[0]?.toUpperCase() ?? '?'}</div>}
                </div>

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

                <div className="seat-badges">
                  {index === displayedDealerIndex && <span className="pin dealer">D</span>}
                  {howManyActivePlayers(players) === 2 && index === displayedDealerIndex && <span className="pin smallBlind">SB</span>}
                  {howManyActivePlayers(players) === 2 && index === getNextActivePlayer(displayedDealerIndex) && <span className="pin bigBlind">BB</span>}
                  {howManyActivePlayers(players) > 2 && index === getNextActivePlayer(displayedDealerIndex) && <span className="pin smallBlind">SB</span>}
                  {howManyActivePlayers(players) > 2 && index === getNextActivePlayer(getNextActivePlayer(displayedDealerIndex)) && <span className="pin bigBlind">BB</span>}
                </div>
              </div>

              <div className="seat-plate">
                <span className="m-name">{player.name}{isDisconnected ? ' ⚠' : ''}</span>
                <span className="m-chips">{player.chips.toLocaleString()}</span>
              </div>
            </div>
          );
        })}

        {/* Chips rendered outside seat stacking contexts so z-index is relative to table */}
        <div className="chips-layer">
          {players.map((player, index) => {
            if (player.status === 'busted' || player.currentBet <= 0) return null;
            return (
              <div
                key={`${index}-${roundKey}`}
                className={`mobile-bet-indicator chip-for-seat-${relativeSeat(index)}`}
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
            );
          })}
        </div>

        {myIndex !== -1 && (
          <div className="emote-area">
            <button
              className={`emote-trigger-btn${emoteCooldown ? ' cooldown' : ''}`}
              onClick={() => !emoteCooldown && setShowEmotePicker(p => !p)}
            >
              <span className="emote-trigger-emoji">🤠</span>
            </button>
            {showEmotePicker && !emoteCooldown && (
              <div className="emote-picker">
                <div className="emote-picker-title">Send a Tell</div>
                <div className="emote-grid">
                  {EMOTES.map(emoji => (
                    <button key={emoji} className="emote-btn" onClick={() => handleEmote(emoji)}>{emoji}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mobile-actions">
        {showDealBtn && (
          <div className="action-buttons">
            <button className="action-btn raise full" onClick={drawHandler}>
              <span className="btn-label">{phase === 'waiting' ? 'Deal Cards' : 'Next Round'}</span>
            </button>
          </div>
        )}

        {showActionBtns && (
          <div className="action-buttons">
            <button className="action-btn fold" onClick={handleFold}>
              <span className="btn-label">Fold</span>
            </button>

            {players[currentPlayerIndex].currentBet === currentBet ? (
              <button className="action-btn call" onClick={handleCheck}>
                <span className="btn-label">Check</span>
              </button>
            ) : (
              <button className="action-btn call" onClick={handleCall}>
                <span className="btn-label">Call</span>
                <span className="btn-sub">{(currentBet - players[currentPlayerIndex].currentBet).toLocaleString()}</span>
              </button>
            )}

            <button
              className="action-btn raise"
              onClick={() => { setRaiseInput(prev => clampRaise(prev || bigBlind)); setShowRaiseModal(true); }}
            >
              <svg width="15" height="9" viewBox="0 0 24 14" fill="none" stroke="#3a2408" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8" /></svg>
              <span className="btn-label">Raise</span>
              <span className="btn-cue">Set amount</span>
            </button>
          </div>
        )}

        {!showDealBtn && !showActionBtns && (
          <div className="action-status">
            {myIndex === -1 ? 'Spectating' : isMyTurn ? '' : 'Waiting for players…'}
          </div>
        )}
      </div>

    </div>
    </>
  );
};

export default GameView;
