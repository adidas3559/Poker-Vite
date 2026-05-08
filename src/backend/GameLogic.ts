import type { CardState, GameState, PlayerState, GamePhase } from "../types/GameState"
import { createDeck, shuffleDeck, getNextActiveIndex, howManyActivePlayers, drawCard, getLeftOfDealer, getHandRanking, contestHands, copyPlayers } from './utils';



const createPlayer = (id: string, name: string, chips: number): PlayerState => {
  return {
    id,
    name,
    chips,
    hand: [],
    currentBet: 0,
    status: 'active',
  }
}

const createGame = (players: PlayerState[]): GameState => {
  return {
    players,
    deck: [],                                                                                                     
    tableCards: [],
    pot: 0,                                                                                                       
    currentBet: 0,
    smallBlind: 2,
    bigBlind: 4,
    dealerIndex: 0,                                                                                               
    currentPlayerIndex: 0,
    lastRaisePlayerIndex: 0,                                                                                      
    phase: 'waiting',                                                                                             
    winners: [],
    error: '',
  }
}

const DealCards = (game: GameState) => {
  const deck = createDeck();
  shuffleDeck(deck);
  
  // resetting for round
  const tableCards: CardState[] = [];

  // possible bug since we're not using copyPlayers
  const players:PlayerState[] = game.players.map(player => {
    const folded = player.status === 'folded';
    return {
      ...player,
      status: folded ? 'active' : player.status,
      currentBet: 0,
      hand: [],
    };
  })

  const dealerIndex = game.dealerIndex;
  const start = getNextActiveIndex(players, dealerIndex);
  for (let i = 0; i < players.length; i++) {
    if (players[(start + i) % players.length].status !== 'busted') {
      players[(start + i) % players.length].hand.push(deck.pop() as CardState);
    }
  }
  for (let i = 0; i < players.length; i++) {
    if (players[(start + i) % players.length].status !== 'busted') {
      players[(start + i) % players.length].hand.push(deck.pop() as CardState);
    }
  }


  const currentBet = game.bigBlind;
  const pot = game.smallBlind + game.bigBlind;
  const phase: GamePhase = 'preflop';

  if (howManyActivePlayers(players) === 2) {
    const currentPlayerIndex = dealerIndex; // first to act is dealer/small blind preflop
    const lastRaisePlayerIndex = dealerIndex;
    players[dealerIndex].currentBet = game.smallBlind; // Dealer is small blind
    players[dealerIndex].chips = players[dealerIndex].chips - game.smallBlind;
    players[getNextActiveIndex(players, dealerIndex)].currentBet = game.bigBlind; // Other player is big blind
    players[getNextActiveIndex(players, dealerIndex)].chips = (players[getNextActiveIndex(players, dealerIndex)].chips - game.bigBlind);

    return {
      ...game,
      players,
      currentBet,
      pot,
      phase,
      currentPlayerIndex,
      lastRaisePlayerIndex,
    }
  }

  if (howManyActivePlayers(players) === 1) {
    console.log('GAME WINNER!!!!');
    
  }

  const currentPlayerIndex = getNextActiveIndex(players, dealerIndex + 2);
  const lastRaisePlayerIndex = getNextActiveIndex(players, dealerIndex + 2);
  players[getNextActiveIndex(players, dealerIndex)].currentBet = game.smallBlind;
  players[getNextActiveIndex(players, dealerIndex)].chips = players[getNextActiveIndex(players, dealerIndex)].chips - game.smallBlind;
  players[getNextActiveIndex(players, dealerIndex + 1)].currentBet = game.bigBlind;
  players[getNextActiveIndex(players, dealerIndex + 1)].chips = players[getNextActiveIndex(players, dealerIndex + 1)].chips - game.bigBlind;

  return {
    ...game,
    deck,
    players,
    currentBet,
    pot,
    phase,
    currentPlayerIndex,
    lastRaisePlayerIndex,
    tableCards,
  }
}


const raiseHandler = (game: GameState, betInput: number):GameState => {
  const players = copyPlayers(game.players);
  if (betInput > players[game.currentPlayerIndex].chips) {
    return { ...game, error: 'not enough chips!' };
  }
  if (betInput < game.bigBlind) {
    return { ...game, error: 'not big enough bet!' };
  }

  const lastRaisePlayerIndex = game.currentPlayerIndex;
  const currentBet:number = game.currentBet + betInput;
  const raiseDelta = currentBet - players[game.currentPlayerIndex].currentBet;
  players[game.currentPlayerIndex].chips -= raiseDelta;
  players[game.currentPlayerIndex].currentBet = currentBet;
  const pot = game.pot + raiseDelta;
  const { currentPlayerIndex, lastPlayer } = checkNextPlayer(game);
  if (lastPlayer) {
    return updateRoundState({ ...game, pot, players, currentPlayerIndex });
  }
  return {
    ...game,
    players,
    currentBet,
    pot,
    currentPlayerIndex,
    lastRaisePlayerIndex,
  }
}

const callHandler = (game: GameState): GameState => {
  const players = copyPlayers(game.players);
  const callAmount = Math.min(
    game.currentBet - players[game.currentPlayerIndex].currentBet,
    players[game.currentPlayerIndex].chips,
  );
  const pot = game.pot + callAmount;
  players[game.currentPlayerIndex].currentBet += callAmount;
  players[game.currentPlayerIndex].chips -= callAmount;

  const { currentPlayerIndex, lastPlayer } = checkNextPlayer(game);
  if (lastPlayer) {
    return updateRoundState({ ...game, pot, players, currentPlayerIndex });
  }
  return {
    ...game,
    players,
    currentPlayerIndex,
    pot,
  }
}

  const checkHandler = (game: GameState): GameState => {
    const { currentPlayerIndex, lastPlayer } = checkNextPlayer(game);
    if (lastPlayer) {
      return updateRoundState({ ...game, currentPlayerIndex });
    }
    return {
      ...game,
      currentPlayerIndex,
    }
  }

  const foldHandler = (game: GameState): GameState => {
    const players = copyPlayers(game.players);
    players[game.currentPlayerIndex].status = 'folded';
    const nonFoldedPlayers = players.filter(player => player.status !== 'folded');
    if (nonFoldedPlayers.length === 1) {
      return declareWinner(nonFoldedPlayers, { ...game, players });
    }
    const index = game.currentPlayerIndex;
    const updatedGame = { ...game, players };
    const { currentPlayerIndex, lastPlayer } = checkNextPlayer(updatedGame);
    if (lastPlayer) {
      return updateRoundState({ ...updatedGame, currentPlayerIndex });
    }
    if (index === game.lastRaisePlayerIndex) {
      return {
        ...game,
        players,
        currentPlayerIndex,
        lastRaisePlayerIndex: game.currentPlayerIndex,
      }
    }

    return {
      ...game,
      players,
      currentPlayerIndex,
    }
  }

  const allInHandler = (game: GameState): GameState => {
    const players = copyPlayers(game.players);
    let currentBet = game.currentBet;
    let lastRaisePlayerIndex = game.lastRaisePlayerIndex;
    const allInAmount = players[game.currentPlayerIndex].chips + players[game.currentPlayerIndex].currentBet;
    if (allInAmount > currentBet) {
      currentBet = allInAmount;
      lastRaisePlayerIndex = game.currentPlayerIndex;
    }
    players[game.currentPlayerIndex].currentBet = allInAmount;
    players[game.currentPlayerIndex].chips = 0;
    const pot = game.pot + allInAmount;

    const { currentPlayerIndex, lastPlayer } = checkNextPlayer(game);
    if (lastPlayer) {
      return updateRoundState({ ...game, players, currentPlayerIndex });
    }
    return {
      ...game,
      players,
      currentBet,
      pot,
      currentPlayerIndex,
      lastRaisePlayerIndex,
    }
  }






const checkNextPlayer = (game: GameState) => {
  const nextPlayerIndex = getNextActiveIndex(game.players, game.currentPlayerIndex);
  if (nextPlayerIndex === game.lastRaisePlayerIndex) {
    return { currentPlayerIndex: game.currentPlayerIndex, lastPlayer: true }
  } else {
    const currentPlayerIndex = nextPlayersTurn(game);
    return { currentPlayerIndex, lastPlayer: false };
  }
}

const nextPlayersTurn = (game: GameState) => {
  let currentPlayerIndex = game.currentPlayerIndex;
  do {
    if (game.currentPlayerIndex >= game.players.length - 1) {
      currentPlayerIndex = 0;
    } else {
      currentPlayerIndex++;
    }
  } while ((game.players[currentPlayerIndex] ?? game.players[0]).status === 'folded' || (game.players[currentPlayerIndex] ?? game.players[0]).status === 'busted')
  return currentPlayerIndex;
}


const updateRoundState = (game: GameState): GameState => {
  const deck = game.deck;
  if (game.phase === 'preflop') {
    game.phase = 'flop';
    drawCard(deck); // burn card
    const flopCard1: CardState = drawCard(deck);
    const flopCard2: CardState = drawCard(deck);
    const flopCard3: CardState = drawCard(deck);
    const tableCards: CardState[] = [flopCard1, flopCard2, flopCard3];
    const {currentPlayerIndex, lastRaisePlayerIndex} = getLeftOfDealer(game);
    return {
      ...game,
      deck,
      currentPlayerIndex,
      lastRaisePlayerIndex,
      tableCards,
    };
  } else if (game.phase === 'flop') {
    game.phase = 'turn';
    drawCard(deck); // burn card
    const turnCard = drawCard(deck);
    const tableCards: CardState[] = [...game.tableCards, turnCard];
    const {currentPlayerIndex, lastRaisePlayerIndex} = getLeftOfDealer(game);
    return {
      ...game,
      deck,
      currentPlayerIndex,
      lastRaisePlayerIndex,
      tableCards,
    };
  } else if (game.phase === 'turn') {
    game.phase = 'river';
    drawCard(deck); // burn card
    const riverCard = drawCard(deck);
    const tableCards: CardState[] = [...game.tableCards, riverCard];
    const {currentPlayerIndex, lastRaisePlayerIndex} = getLeftOfDealer(game);
    return {
      ...game,
      deck,
      currentPlayerIndex,
      lastRaisePlayerIndex,
      tableCards,
    };
  } else {
    console.log('🚀 ~ updateRoundState ~ game:', game);
    const nonFoldedPlayers = game.players.filter(player => player.status !== 'folded');
    const finalHands = nonFoldedPlayers.map(player => ({ ...getHandRanking(player, game.tableCards)}));
    console.log('🚀 ~ updateRoundState ~ finalHands:', finalHands);
    const handOrder = ['highCard', 'pair', 'twoPair', 'threeOfAKind', 'straight', 'flush', 'fullHouse', 'fourOfAKind', 'straightFlush', 'royalFlush'];
    finalHands.sort((a, b) => {
      const handA = handOrder.indexOf(a.highestHand);
      const handB = handOrder.indexOf(b.highestHand);

      return handB - handA;
    });
    console.log('🚀 ~ updateRoundState ~ finalHands:', finalHands);
    // const highestPlayers = finalHands.filter(hand => hand.highestHand === highestHand);
    const winners = contestHands(finalHands);
    console.log('🚀 ~ updateRoundState ~ winners:', winners);
    const newGame = declareWinner(winners, game);
    console.log('🚀 ~ updateRoundState ~ newGame:', newGame);
    return newGame;
  }
}

type nestedPlayers = (PlayerState | PlayerState[])[];
const declareWinner = (winners: nestedPlayers, game: GameState): GameState => {
  console.log('🚀 ~ Game ~ winners:', winners);

  

  if (winners.length === 0) {
    console.error('Got 0 winners')
    return {
      ...game,
      error: 'Zero winners!!',
    };
  }

  const getMaxWinning = (player: PlayerState) => {
    const players = game.players.filter(p => p.name !== player.name);
    const playerBet = player.currentBet;
    let maxWinning = playerBet;
    players.map(player => {
      if (player.currentBet <= playerBet) {
        maxWinning += player.currentBet;
      } else {
        maxWinning += playerBet;
      }
    });

    return maxWinning;
  }

  const players = copyPlayers(game.players);
  let pot = game.pot;

  winners.forEach(winnerGroup => {
    if (Array.isArray(winnerGroup)) {
      winnerGroup.forEach(winner => {
        const maxWinning = getMaxWinning(winner);
        const wonChips = Math.round(maxWinning / winnerGroup.length) >= pot ? Math.round(maxWinning / winnerGroup.length) : Math.round(pot / winnerGroup.length);
        players.find(p => p.id === winner.id)!.chips += wonChips;
        pot -= wonChips;
      });
    } else {
      const maxWinning = getMaxWinning(winnerGroup);
      const wonChips = maxWinning <= pot ? Math.round(maxWinning) : pot;
      players.find(p => p.id === winnerGroup.id)!.chips += wonChips;
      pot -= wonChips;
    }
  })


  const phase = 'end';
  // Prepping for next round
  const dealerIndex = getNextActiveIndex(players, game.dealerIndex);
  players.forEach(player => {
    if (player.chips <= 0) {
      player.status = 'busted';
    }
  })

  return {
    ...game,
    pot,
    players,
    phase,
    dealerIndex,
  }
}







export {
  createPlayer,
  createGame,
  DealCards,
  raiseHandler,
  callHandler,
  checkHandler,
  foldHandler,
  allInHandler,
}
