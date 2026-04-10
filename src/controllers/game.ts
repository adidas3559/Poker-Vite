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
  relevantCardsSimpler: number[];
  kickerCards: number[],
  allCards: Card[],
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
    // relevantCards = twoOfAKind(cardsByValue);
    relevantCardsSimpler = twoOfAKind(cardsByValue);
  };
  if (twoOfAKind(cardsByValue).length > 1) {
    highestHand = 'twoPair';
    // relevantCards = twoOfAKind(cardsByValue);
    relevantCardsSimpler = twoOfAKind(cardsByValue);
  }
  if (threeOfAKind(cardsByValue).length > 0) {
    highestHand = 'threeOfAKind';
    // relevantCards = threeOfAKind(cardsByValue);
    relevantCardsSimpler = threeOfAKind(cardsByValue);
  }
  if (straight(allCards).length >= 5) {
    highestHand = 'straight';
    // relevantCards = straight(allCards);
    relevantCardsSimpler = straight(allCards);
  }
  if (flush(cardsBySuit).length > 0) {
    highestHand = 'flush';
    // relevantCards = flush(cardsBySuit);
    relevantCardsSimpler = flush(cardsBySuit);
  }
  if (threeOfAKind(cardsByValue).length > 0 && twoOfAKind(cardsByValue).length > 0) {
    highestHand = 'fullHouse';
    // relevantCards = [...threeOfAKind(cardsByValue), ...twoOfAKind(cardsByValue)];
    relevantCardsSimpler = [...threeOfAKind(cardsByValue), ...twoOfAKind(cardsByValue)];
  }
  if (fourOfAKind(cardsByValue).length > 0) {
    highestHand = 'fourOfAKind';
    // relevantCards = fourOfAKind(cardsByValue);
    relevantCardsSimpler = fourOfAKind(cardsByValue);
  }
  if (straight(allCards).length >= 5 && flush(cardsBySuit).length > 0) {
    highestHand = 'straightFlush';
    // relevantCards = [...straight(allCards), ...flush(cardsBySuit)];
    // relevantCardsSimpler = [...straight(allCards), ...flush(cardsBySuit)];
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
  
  const cardValues:number[] = allCards.map(card => card.getValue());
  const kickerCards = cardValues.filter(card => !relevantCardsSimpler.includes(card));
  
  return { highestHand, player, relevantCardsSimpler, allCards, kickerCards };
}


const contestHands = (highestPlayers: HandRanking[]) => {
  console.log('🚀 ~ contestHands ~ highestPlayers:', highestPlayers);
  const highestHand = highestPlayers[0].highestHand;
  let winners = [...highestPlayers];

  if (highestHand === 'highCard') {
    for (let i = 0; i < 5; i++) {
      const maxValue = Math.max(...highestPlayers.map(player => player.relevantCardsSimpler[i]));
      winners = winners.filter(player => player.relevantCardsSimpler[i] === maxValue);
    }
  }

  if (highestHand === 'pair' || highestHand === 'twoPair' || highestHand === 'threeOfAKind' || highestHand === 'fullHouse' || highestHand === 'fourOfAKind') {
    let relevantIndex = 0;
    let kickerIndex = 0;
    for (let i = 0; i < 5 && winners.length !== 1; i++) {
      if (relevantIndex < winners[0].relevantCardsSimpler.length) {
        const maxValue = Math.max(...winners.map(player => player.relevantCardsSimpler[relevantIndex]));
        winners = winners.filter(player => player.relevantCardsSimpler[relevantIndex] === maxValue);
        relevantIndex++;        
        
        // account for how many cards would be in these hands, minus the index++ at the end of the function
        if (highestHand === 'pair'|| highestHand === 'twoPair') {
          i += 1;
        }
        if (highestHand === 'threeOfAKind') {
          i += 2;
        }
        if (highestHand === 'fourOfAKind') {
          i += 3;
        }
      } else {
        const maxValue = Math.max(...winners.map(player => player.kickerCards[kickerIndex]));
        winners = winners.filter(player => player.kickerCards[kickerIndex] === maxValue);
        kickerIndex++;
      }
    }
  }

  // flush is accidentally taking non suited card into account for contest

  if (highestHand === 'straight') {
    const maxValue = Math.max(...winners.map(player => player.relevantCardsSimpler[0]));
    winners = winners.filter(player => player.relevantCardsSimpler[0] === maxValue);
  }

  if (highestHand === 'flush' || highestHand === 'straightFlush') {
    console.log('flush', winners);
    for (let i:number = 0; i < 5 && winners.length !== 1; i++) {
      // console.log('testing', ...winners.map(player => player.relevantCardsSimpler[i]));
      const maxValue = Math.max(...winners.map(player => player.relevantCardsSimpler[i]));
      console.log('🚀 ~ contestHands ~ maxValue:', maxValue);
      winners = winners.filter(player => player.relevantCardsSimpler[i] === maxValue);
      console.log('🚀 ~ contestHands ~ winners:', winners);
    }
  }

  if (highestHand === 'royalFlush') {
    return winners;
  }
  return winners;
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



