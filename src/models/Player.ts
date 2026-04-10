import Card from './Card';
// import Deck from './Deck';

type playerStatuses = 'active' | 'folded' | 'busted' | 'break'; 

class Player {
  public name: string;
  private hand!: Card[];
  public chips: number;
  public currentBet: number;
  public folded: boolean;
  public busted: boolean;
  public status: playerStatuses;

  constructor(name: string, chips: number) {
    this.name = name;
    this.hand = [];
    this.chips = chips;
    this.currentBet = 0;
    this.folded = false;
    this.busted = false;
    this.status = 'active';
  }

  public drawCards(card: Card) {
    this.hand.push(card);
  }

  public getHand() {
    return this.hand
  }

  public resetHand() {
    this.hand = [];
  }

  public setChips(newValue: number) {
    this.chips = newValue;
  }

  public setCurrentBet(newValue: number) {
    this.currentBet = newValue;
  }

  public resetCurrentBet() {
    this.currentBet = 0;
  }

  public SetFolded(newValue: boolean) {
    this.folded = newValue;
  }

  public SetBusted(newValue: boolean) {
    this.busted = newValue;
  }

}

export default Player;

