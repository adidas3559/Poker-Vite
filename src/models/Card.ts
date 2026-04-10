export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const orderMap = new Map([
  ['ace', 14],
  ['king', 13],
  ['queen', 12],
  ['jack', 11],
]);

class Card {
  // private id: number;
  public number: string;
  public suit: Suit;

  constructor(number: string, suit: Suit) {
    // this.id = id;
    this.number = number;
    this.suit = suit;
  }

  // Not needed yet, but we can use this function if we want to make a string into a Suit type.
  // We can just do newSuit:string as Suit, but this could silently crash if we do a string that isn't included in Suit type
  public static checkSuitType(newSuit: string): Suit | null {
    if (SUITS.includes(newSuit as Suit)) {
      return newSuit as Suit;
    }
    console.error('not a suit');
    return null;
  }

  public getValue():number {
    let value:number = Number(this.number)
    if (isNaN(value)) {
      value = orderMap.get(this.number) ?? 0;
    }

    return value;
  }

  public static getNumberValue(input:string):number {
    let value:number = Number(input)
    if (isNaN(value)) {
      value = orderMap.get(input) ?? 0;
    }

    return value;
  }
  

}


export default Card;



