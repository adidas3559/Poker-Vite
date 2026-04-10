import Card from "./Card";

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

class Deck {
  public cards!: Card[];

  constructor() {
    // this.cards = cards;
  }

  public createDeck () {
    this.cards = [];
    const suits: Array<Suit> = ['spades', 'hearts', 'diamonds', 'clubs'];
    suits.forEach(suit => {
      const suitString: Suit = suit as Suit;
      for(let i:number = 2; i <= 10; i++) {
        const newCard: Card = new Card(i.toString(), suitString);
        this.cards.push(newCard);
      }
      this.cards.push(new Card('jack', suitString));
      this.cards.push(new Card('queen', suitString));
      this.cards.push(new Card('king', suitString));
      this.cards.push(new Card('ace', suitString));
    });

  }

  private shuffleStack(firstHalf: Card[], secondHalf: Card[]) {
    // Tried to brute force for realism, but  Fisher Yates shuffle algo is better and easier
    // That is used in shuffleDeck function
    
    // const firstHalf = this.cards.splice(0, 30);
    // console.log('🚀 ~ Deck ~ shuffleDeck ~ firstHalf:', firstHalf);
    // const secondHalf= this.cards.splice(30, this.cards.length - 1);
    // console.log('🚀 ~ Deck ~ shuffleDeck ~ secondHalf:', secondHalf);
    // this.shuffleStack(firstHalf, secondHalf);
    // this.shuffleStack(firstHalf, secondHalf);
    // this.shuffleStack(firstHalf, secondHalf);
    const newDeck: Card[] = [];

    while (firstHalf.length > 0) {
      const card1 = firstHalf.pop();
      if (card1 !== undefined) {
        newDeck.push(firstHalf.pop() as Card);
      }

      if (secondHalf.length > 0) {
        newDeck.push(secondHalf.pop() as Card);
      }
      
    }

  }

  public shuffleDeck() {
    let m = this.cards.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);

      // And swap it with the current element.
      t = this.cards[m];
      this.cards[m] = this.cards[i];
      this.cards[i] = t;
    }
    
    return this.cards;



  }


  public pop() {
    if (this.cards.length <= 0) {
      return null;
    }
    return this.cards.pop();
  }

}

export default Deck;



