import { get } from 'lodash';
import Card from "../models/Card";

type CardCompare = {
  count: number,
  cards: Card[],
}


const twoOfAKind = (cardsByValue: Map<string, CardCompare>) => {
  // By adding underscore to key (_key), we get typescript to ignore that key isn't being used
  // eslint-disable-next-line
  const twoOfAKind = [...cardsByValue.entries()].filter(([_key, value]) => value.count === 2);  
  console.log('🚀 ~ twoOfAKind ~ twoOfAKind:', twoOfAKind);
  const returnValue = twoOfAKind.map(card => (get(card, '[1].cards')));
  console.log('🚀 ~ twoOfAKind ~ returnValue:', returnValue);
  return returnValue;
}

const threeOfAKind = (cardsByValue: Map<string, CardCompare>) => {
  // By adding underscore to key (_key), we get typescript to ignore that key isn't being used
  // eslint-disable-next-line
  const threeOfAKind = [...cardsByValue.entries()].filter(([_key, value]) => value.count === 3);
  const returnValue = threeOfAKind.map(card => (card[1].cards));
  return returnValue;
}

const fourOfAKind = (cardsByValue: Map<string, CardCompare>) => {
  // By adding underscore to key (_key), we get typescript to ignore that key isn't being used
  // eslint-disable-next-line
  const fourOfAKind = [...cardsByValue.entries()].filter(([_key, value]) => value.count === 4);
  const returnValue = fourOfAKind.map(card => (card[1].cards));
  return returnValue;
}

const straight = (allCards: Card[]) => {
  // By adding underscore to key (_key), we get typescript to ignore that key isn't being used
  // eslint-disable-next-line
  let straightCount = 0;
  let lastValue = 0;
  let cardList: Card[] = [];
  allCards.forEach(card => {
    if (lastValue - 1 === card.getValue()) {
      straightCount++;
      cardList = [...cardList, card];
    } else {
      straightCount = 1;
      cardList = [card];
    }
    lastValue = card.getValue();
  });
  return [cardList];
}

const straight2 = (allCards: Card[]) => {
  // By adding underscore to key (_key), we get typescript to ignore that key isn't being used
  // eslint-disable-next-line
  let straightCount = 0;
  let lastValue = 0;
  let straightCards: number[] = [];
  allCards.forEach(card => {
    if (lastValue - 1 === card.getValue()) {
      straightCount++;
      straightCards = [...straightCards, card.getValue()]
    } else {
      straightCount = 1;
      straightCards = [card.getValue()];
    }
    lastValue = card.getValue();
  });
  return straightCards;
}

const flush = (cardsBySuit: Map<string, CardCompare>) => {
  // By adding underscore to key (_key), we get typescript to ignore that key isn't being used
  // eslint-disable-next-line
  const flush = [...cardsBySuit.entries()].find(([_key, value]) => value.count === 5) || [];
  const returnValue = flush.map(card => (get(card, '[1].cards', [])));
  return returnValue || [];
}


export {
  twoOfAKind,
  threeOfAKind, 
  fourOfAKind,
  straight,
  straight2,
  flush,
}

