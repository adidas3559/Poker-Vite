import Deck from "../models/Deck";
import Player from "../models/Player";
import Card from "../models/Card";
import Game from '../models/Game';
import { flush, fourOfAKind, straight, threeOfAKind, twoOfAKind } from "./handUtilsSimpler";

type CardCompare = {
  count: number,
  cards: Card[],
}

type HandRanking = {
  highestHand: string;
  player: Player;
  allCards: Card[],
  relevantCardValues: number[],
}

// Global Game State.
// Moving all game state and logic from this file and Game.tsx file to Game Class
const player1 = new Player('Blake', 20);
const player2 = new Player('Alissa', 20);
const player3 = new Player('Stephen', 20);
const player4 = new Player('Caitlyn', 20);
const player5 = new Player('Ben', 20);
const player6 = new Player('Max', 20);
const deck = new Deck();

// const pot: number = 0;
// const round:number = 1;
// const roundBet: number = 0;
// const river: Card[] = [];

const dealCards = () => {
  deck.createDeck();
  deck.shuffleDeck();
  player1.drawCards(deck.pop() as Card);
  player2.drawCards(deck.pop() as Card);
  player3.drawCards(deck.pop() as Card);
  player4.drawCards(deck.pop() as Card);
  player5.drawCards(deck.pop() as Card);
  player6.drawCards(deck.pop() as Card);
  player1.drawCards(deck.pop() as Card);
  player2.drawCards(deck.pop() as Card);
  player3.drawCards(deck.pop() as Card);
  player4.drawCards(deck.pop() as Card);
  player5.drawCards(deck.pop() as Card);
  player6.drawCards(deck.pop() as Card);


  return [
    player1,
    player2,
    player3,
    player4,
    player5,
    player6
  ];
  
}

const testDealCards = () => {
  deck.createDeck();
  deck.shuffleDeck();
  const testCard1:Card = new Card('king', 'hearts');
  const testCard2:Card = new Card('jack', 'hearts');
  const testCard3:Card = new Card('5', 'hearts');
  const testCard4:Card = new Card('ace', 'diamonds');
  player1.drawCards(testCard1);
  player2.drawCards(testCard3);
  player3.drawCards(deck.pop() as Card);
  player4.drawCards(deck.pop() as Card);
  player5.drawCards(deck.pop() as Card);
  player6.drawCards(deck.pop() as Card);
  player1.drawCards(testCard2);
  player2.drawCards(testCard4);
  player3.drawCards(deck.pop() as Card);
  player4.drawCards(deck.pop() as Card);
  player5.drawCards(deck.pop() as Card);
  player6.drawCards(deck.pop() as Card);


  return [
    player1,
    player2,
    player3,
    player4,
    player5,
    player6
  ];
  
}

const playerBet = () => {

}

const drawCard = () => {
  return deck.pop() as Card;
}


const getHandRanking = (player: Player, tableCards: Card[]) => {
  const hand = player.getHand();
  const allCards = [...hand, ...tableCards];
  allCards.sort((a, b) => (b.getValue() - a.getValue()));


  // key: number (each value)
  // value: { count: number, cards: card[] }
  const cardsByValue = new Map<string, CardCompare>();
  allCards.forEach(card => {
    if (cardsByValue.has(card.number)) {
      const count = (cardsByValue.get(card.number)?.count ?? 0) + 1;
      const cards = cardsByValue.get(card.number)?.cards ?? [];
      cardsByValue.set(card.number, { count: count, cards: [card, ...cards] });
    } else {
      cardsByValue.set(card.number, { count: 1, cards: [card] });
    }
  });
  const cardValues:number[] = allCards.map(card => card.getValue());


  // key: string (each suit)
  // value: { count: number, cards: card[] }
  const cardsBySuit = new Map<string, CardCompare>();
  allCards.forEach(card => {
    if (cardsBySuit.has(card.suit)) {
      const count = (cardsBySuit.get(card.suit)?.count ?? 0) + 1;
      const cards = cardsBySuit.get(card.suit)?.cards ?? [];
      cardsBySuit.set(card.suit, { count: count, cards: [card, ...cards] });
    } else {
      cardsBySuit.set(card.suit, { count: 1, cards: [card] });
    }
  });

  
  // added checks here
  
  

  // let relevantCards:Card[][] = [];
  let relevantCardsSimpler: number[] = [];
  let highestHand = 'highCard';
  relevantCardsSimpler = allCards.map(card => card.getValue());

  if (twoOfAKind(cardsByValue).length > 0) {
    highestHand = 'pair';
    relevantCardsSimpler = twoOfAKind(cardsByValue).flat();
  };
  if (twoOfAKind(cardsByValue).length > 1) {
    highestHand = 'twoPair';
    relevantCardsSimpler = twoOfAKind(cardsByValue).flat();
  }
  if (threeOfAKind(cardsByValue).length > 0) {
    highestHand = 'threeOfAKind';
    relevantCardsSimpler = threeOfAKind(cardsByValue);
  }
  if (straight(allCards).length >= 5) {
    highestHand = 'straight';
    relevantCardsSimpler = straight(allCards);
  }
  if (flush(cardsBySuit).length > 0) {
    highestHand = 'flush';
    relevantCardsSimpler = flush(cardsBySuit);
  }
  if (threeOfAKind(cardsByValue).length > 0 && twoOfAKind(cardsByValue).length > 0) {
    highestHand = 'fullHouse';
    relevantCardsSimpler = [...threeOfAKind(cardsByValue), ...twoOfAKind(cardsByValue).flat()];
  }
  if (fourOfAKind(cardsByValue).length > 0) {
    highestHand = 'fourOfAKind';
    relevantCardsSimpler = fourOfAKind(cardsByValue);
  }
  if (straight(allCards).length >= 5 && flush(cardsBySuit).length > 0) {
    highestHand = 'straightFlush';
    relevantCardsSimpler = straight(allCards);
    
    if (
      allCards[0].getValue() === 14 &&
      allCards[1].getValue() === 13 &&
      allCards[2].getValue() === 12 &&
      allCards[3].getValue() === 11 &&
      allCards[4].getValue() === 10
    ) {
      highestHand = 'royalFlush';
    }
  }
  
  const singleCards = cardValues.filter(card => !relevantCardsSimpler.includes(card));
  const relevantCardValues = [...relevantCardsSimpler, ...singleCards].slice(0, 5);
  
  return { highestHand, player, allCards, relevantCardValues };
}


const compareSortedArrays = (arr1: number[], arr2: number[]) => {
  if (!arr2) return arr1;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] > arr2[i]) {
      return -1;
    }
    if (arr2[i] > arr1[i]) {
      return 1;
    }
  }
  return 0
}

function arraysEqual(a: number[], b: number[]): boolean {                                          
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

type nestedHandRanking = (HandRanking | HandRanking[])[];

function combineDuplicateHands(players: HandRanking[]): nestedHandRanking {
  const playersCombined: nestedHandRanking = [];
  if (players.length <= 1) {
    return players;
  }
  for (let i = 0; i < players.length; i++) {
    if (i === 0) {
      continue;
    }
    
    const currentPlayer = players[i];
    const prevPlayer = players[i - 1];
    if (arraysEqual(currentPlayer.relevantCardValues, prevPlayer.relevantCardValues)) {
      // check if prevPlayer is alread in group
      if (Array.isArray(playersCombined[playersCombined.length - 1])) {
        playersCombined[playersCombined.length - 1] = [...playersCombined[playersCombined.length - 1] as HandRanking[], currentPlayer];
        // playersCombined.push([prevPlayer, currentPlayer]);
      } else {
        playersCombined.push([prevPlayer, currentPlayer]);
      }
      // else puch players into 
    } else {
      playersCombined.push(currentPlayer);
    }
  }
  return playersCombined;
}

const contestHands = (highestPlayers: HandRanking[]) => {
  console.log('🚀 ~ contestHands ~ highestPlayers:', highestPlayers);
  const highestPlayersMap = new Map();
  highestPlayers.forEach(player => {
    const hand = player.highestHand;
    if (highestPlayersMap.has(hand)) {
      highestPlayersMap.set(hand, [...highestPlayersMap.get(hand), player])
    } else {
      highestPlayersMap.set(hand, [player]);
    }
  });

  const playersOrder: HandRanking[] = [];
  for (const key of highestPlayersMap.keys()) {
    const handPlayers = highestPlayersMap.get(key);
    handPlayers.sort((a:HandRanking, b:HandRanking) => {
      return compareSortedArrays(a.relevantCardValues, b.relevantCardValues);
    });
    
    playersOrder.push(...handPlayers)
  }

  // check for identicals
  const combinedPlayersHands = combineDuplicateHands(playersOrder);
  
  const combinedPlayers = combinedPlayersHands.map(item => {
    if (Array.isArray(item)) {
      return item.map(nestedItem => nestedItem.player);
    }
    return item.player;
  })

  return combinedPlayers;
}


// These don't have much going on, but in the real app they will be where we call the BE calls
const game = new Game();

const cDealCards = () => {
  return game.dealCards();
}

const cTestDealCards = () => {
  return game.testDealCards();
}

const cRaiseHandler = (betInput: number) => {
  return game.raiseHandler(betInput);
}

const cCheckHandler = () => {
  return game.checkHandler();
}

const cCallHandler = () => {
  return game.callHandler();
}

const cAllInHandler = () => {
  return game.allInHandler();
}

const cFoldHandler = () => {
  return game.foldHandler();
}


export {
  dealCards,
  testDealCards,
  playerBet,
  drawCard,
  getHandRanking,
  contestHands,

  cDealCards,
  cTestDealCards,
  cRaiseHandler,
  cCheckHandler,
  cCallHandler,
  cAllInHandler,
  cFoldHandler,
}



