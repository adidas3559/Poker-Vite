import Player from './Player';
import Deck from './Deck';
import Card from './Card';
import { contestHands, getHandRanking } from '../controllers/game';

type states = 'none' | 'preflop' | 'flop' | 'turn' | 'river' | 'end';
type nestedPlayers = (Player | Player[])[];
// type status = 'none' | 'error' | 'winner';
const handOrder = ['highCard', 'pair', 'twoPair', 'threeOfAKind', 'straight', 'flush', 'fullHouse', 'fourOfAKind', 'straightFlush', 'royalFlush'];

class Game {
  public players: Player[];
  public smallBlind: number;
  public bigBlind: number;
  public currentBet: number;
  public pot: number;
  public dealerIndex: number;
  public currentPlayerIndex: number;
  public lastRaisePlayerIndex: number
  public gameState: states;
  public tableCards: Card[];
  public deck: Deck;
  public winners: nestedPlayers;

  constructor() {
    // this will be moved to a menu
    const player1 = new Player('Blake', 20);
    const player2 = new Player('Alissa', 20);
    const player3 = new Player('Stephen', 20);
    const player4 = new Player('Caitlyn', 20);
    const player5 = new Player('Ben', 10); // For testing purposes, given less chips
    const player6 = new Player('Max', 20);

    this.players = [player1, player2, player3, player4, player5, player6];
    this.winners = [];
    this.smallBlind = 2;
    this.bigBlind = 4;
    this.currentBet = 4;
    this.pot = this.smallBlind + this.bigBlind;
    this.dealerIndex = 0;
    this.currentPlayerIndex = this.dealerIndex + 3;
    this.lastRaisePlayerIndex = this.dealerIndex + 3;
    this.gameState = 'none';
    this.tableCards = [];
    this.deck = new Deck();
  }

  /* Return Function */
  private prepReturn = (error: string = '') => {
    return {
      gamestate: this.gameState,
      tableCards: this.tableCards,
      currentPlayerIndex: this.currentPlayerIndex,
      pot: this.pot,
      currentBet: this.currentBet,
      players: this.players,
      winners: this.winners,
      error: error,
    }
  }
  /* End Return Function */

  /* Round Beginning Functions */
  public addPlayer = (newPlayer: Player) => {
    this.players.push(newPlayer);
  }

  // Test scenario: hardcoded hands and table cards for deterministic testing
  // Hands: Blake=A♥K♥, Alissa=5♣5♦, Stephen=J♠10♠, Caitlyn=2♣7♦, Ben=Q♥Q♣, Max=9♥8♥
  // Table: flop=J♣8♠J♠, turn=8♥, river=Q♣
  public testDealCards = () => {
    this.deck.createDeck();
    this.deck.shuffleDeck();

    // Rig the deck so updateRoundState draws predefined cards.
    // pop() draws from the end: [51]=burn, [50..48]=flop, [47]=burn, [46]=turn, [45]=burn, [44]=river
    this.deck.cards[50] = new Card('jack', 'clubs');
    this.deck.cards[49] = new Card('8', 'spades');
    this.deck.cards[48] = new Card('jack', 'spades');
    this.deck.cards[46] = new Card('8', 'hearts');
    this.deck.cards[44] = new Card('queen', 'clubs');

    this.tableCards = [];
    this.players.forEach(player => {
      player.SetFolded(false);
      player.resetCurrentBet();
      player.resetHand();
    });

    const testHands: [Card, Card][] = [
      // [new Card('ace', 'hearts'),   new Card('king', 'hearts')],   // Blake
      [new Card('queen', 'hearts'),   new Card('queen', 'clubs')],   // Blake
      [new Card('5', 'clubs'),      new Card('5', 'diamonds')],    // Alissa
      [new Card('jack', 'spades'),  new Card('10', 'spades')],     // Stephen
      [new Card('2', 'clubs'),      new Card('7', 'diamonds')],    // Caitlyn
      [new Card('9', 'hearts'),     new Card('8', 'hearts')],      // Ben
      [new Card('queen', 'hearts'), new Card('queen', 'clubs')],   // Max
    ];

    const start = this.getNextActiveIndex(this.players, this.dealerIndex);
    for (let i = 0; i < this.players.length; i++) {
      const playerIndex = (start + i) % this.players.length;
      if (!this.players[playerIndex].busted) {
        this.players[playerIndex].drawCards(testHands[playerIndex][0]);
        this.players[playerIndex].drawCards(testHands[playerIndex][1]);
      }
    }

    this.currentBet = this.bigBlind;
    this.pot = this.smallBlind + this.bigBlind;
    this.gameState = 'preflop';

    if (this.howManyActivePlayers(this.players) === 2) {
      this.currentPlayerIndex = this.dealerIndex;
      this.lastRaisePlayerIndex = this.dealerIndex;
      this.players[this.dealerIndex].setCurrentBet(this.smallBlind);
      this.players[this.dealerIndex].setChips(this.players[this.dealerIndex].chips - this.smallBlind);
      this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].setCurrentBet(this.bigBlind);
      this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].setChips(this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].chips - this.bigBlind);

      return {
        mDealerIndex: this.dealerIndex,
        mSmallBlind: this.smallBlind,
        mBigBlind: this.bigBlind,
        mPlayers: this.players,
        mPot: this.pot,
        mCurrentPlayerIndex: this.currentPlayerIndex,
        mLastRaisePlayerIndex: this.lastRaisePlayerIndex,
        mCurrentBet: this.currentBet,
        mGameState: this.gameState,
        mTableCards: this.tableCards,
      }
    }

    this.currentPlayerIndex = this.getNextActiveIndex(this.players, this.dealerIndex + 2);
    this.lastRaisePlayerIndex = this.getNextActiveIndex(this.players, this.dealerIndex + 2);
    this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].setCurrentBet(this.smallBlind);
    this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].setChips(this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].chips - this.smallBlind);
    this.players[this.getNextActiveIndex(this.players, this.dealerIndex + 1)].setCurrentBet(this.bigBlind);
    this.players[this.getNextActiveIndex(this.players, this.dealerIndex + 1)].setChips(this.players[this.getNextActiveIndex(this.players, this.dealerIndex + 1)].chips - this.bigBlind);

    return {
      mDealerIndex: this.dealerIndex,
      mSmallBlind: this.smallBlind,
      mBigBlind: this.bigBlind,
      mPlayers: this.players,
      mPot: this.pot,
      mCurrentPlayerIndex: this.currentPlayerIndex,
      mLastRaisePlayerIndex: this.lastRaisePlayerIndex,
      mCurrentBet: this.currentBet,
      mGameState: this.gameState,
      mTableCards: this.tableCards,
    }
  }

  public dealCards = () => {
    this.deck.createDeck();
    this.deck.shuffleDeck();
    
    // resetting for round
    this.tableCards = [];
    this.players.forEach(player => {
      player.SetFolded(false);
      player.resetCurrentBet();
      player.resetHand();
    });

    const start = this.getNextActiveIndex(this.players, this.dealerIndex);
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[(start + i) % this.players.length].busted) {
        this.players[(start + i) % this.players.length].drawCards(this.deck.pop() as Card);
      }
    }
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[(start + i) % this.players.length].busted) {
        this.players[(start + i) % this.players.length].drawCards(this.deck.pop() as Card);
      }
    }


    this.currentBet = this.bigBlind;
    this.pot = this.smallBlind + this.bigBlind;
    this.gameState = 'preflop';
    // this.currentPlayerIndex = this.getPlayerIndex(3);
    // this.lastRaisePlayerIndex = this.getPlayerIndex(3);
    // this.players[this.getPlayerIndex(1)].setCurrentBet(this.smallBlind);
    // this.players[this.getPlayerIndex(1)].setChips(this.players[this.getPlayerIndex(1)].chips - this.smallBlind);
    // this.players[this.getPlayerIndex(2)].setCurrentBet(this.bigBlind);
    // this.players[this.getPlayerIndex(2)].setChips(this.players[this.getPlayerIndex(2)].chips - this.bigBlind);

    if (this.howManyActivePlayers(this.players) === 2) {
      this.currentPlayerIndex = this.dealerIndex; // first to act is dealer/small blind preflop
      this.lastRaisePlayerIndex = this.dealerIndex;
      this.players[this.dealerIndex].setCurrentBet(this.smallBlind); // Dealer is small blind
      this.players[this.dealerIndex].setChips(this.players[this.dealerIndex].chips - this.smallBlind);
      this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].setCurrentBet(this.bigBlind); // Other player is big blind
      this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].setChips(this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].chips - this.bigBlind);

      return {
        mDealerIndex: this.dealerIndex,
        mSmallBlind: this.smallBlind,
        mBigBlind: this.bigBlind,
        mPlayers: this.players,
        mPot: this.pot,
        mCurrentPlayerIndex: this.currentPlayerIndex,
        mLastRaisePlayerIndex: this.lastRaisePlayerIndex,
        mCurrentBet: this.currentBet,
        mGameState: this.gameState,
        mTableCards: this.tableCards,
      }
    }

    if (this.howManyActivePlayers(this.players) === 1) {
      console.log('GAME WINNER!!!!');
      
    }

    this.currentPlayerIndex = this.getNextActiveIndex(this.players, this.dealerIndex + 2);
    this.lastRaisePlayerIndex = this.getNextActiveIndex(this.players, this.dealerIndex + 2);
    this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].setCurrentBet(this.smallBlind);
    this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].setChips(this.players[this.getNextActiveIndex(this.players, this.dealerIndex)].chips - this.smallBlind);
    this.players[this.getNextActiveIndex(this.players, this.dealerIndex + 1)].setCurrentBet(this.bigBlind);
    this.players[this.getNextActiveIndex(this.players, this.dealerIndex + 1)].setChips(this.players[this.getNextActiveIndex(this.players, this.dealerIndex + 1)].chips - this.bigBlind);

    return {
      mDealerIndex: this.dealerIndex,
      mSmallBlind: this.smallBlind,
      mBigBlind: this.bigBlind,
      mPlayers: this.players,
      mPot: this.pot,
      mCurrentPlayerIndex: this.currentPlayerIndex,
      mLastRaisePlayerIndex: this.lastRaisePlayerIndex,
      mCurrentBet: this.currentBet,
      mGameState: this.gameState,
      mTableCards: this.tableCards,
    }
  }

  private getNextActiveIndex = (players: Player[], startIndex: number) => {
    let index = startIndex;
    do {
      index = (index + 1) % players.length;
    } while (players[index].busted || players[index].folded);

    return index;
  }
  

  private howManyActivePlayers = (players: Player[]) => {
    const activePlayerCount = players.reduce((count, player) => {
      if (player.busted) {
        return count;
      }
      return count + 1;
    }, 0);
    
    return activePlayerCount;
  }
  /* End Round Beginning Functions */ 


  /* Action Handlers */
  public raiseHandler = (betInput: number) => {
    if (betInput > this.players[this.currentPlayerIndex].chips) {
      // TODO these will eventually send a error to FE
      console.error('not enough chips!');
      const error = 'not enough chips!';
      return this.prepReturn(error);
    }
    if (betInput < this.bigBlind) {
      console.error('not big enough bet!');
      const error = 'not big enough bet!';
      return this.prepReturn(error);
    }

    this.lastRaisePlayerIndex = this.currentPlayerIndex;
    this.currentBet += betInput;
    const raiseDelta = this.currentBet - this.players[this.currentPlayerIndex].currentBet;
    this.players[this.currentPlayerIndex].setChips(this.players[this.currentPlayerIndex].chips - raiseDelta);
    this.players[this.currentPlayerIndex].setCurrentBet(this.currentBet);
    this.pot += raiseDelta;
    // need to have this return gamestate if changed
    this.checkNextPlayer();
    return this.prepReturn();
  }

  public callHandler = () => {
    let call = this.currentBet - this.players[this.currentPlayerIndex].currentBet;
    if (call > this.players[this.currentPlayerIndex].chips) {
      call = this.players[this.currentPlayerIndex].chips;
    }
    this.pot += call;
    this.players[this.currentPlayerIndex].setCurrentBet(this.players[this.currentPlayerIndex].currentBet + call);
    this.players[this.currentPlayerIndex].setChips(this.players[this.currentPlayerIndex].chips - call);

    this.checkNextPlayer();
    return this.prepReturn();
  }

  public checkHandler = () => {
    this.checkNextPlayer();
    return this.prepReturn();
  }

  public foldHandler = () => {
    this.players[this.currentPlayerIndex].SetFolded(true);
    const nonFoldedPlayers = this.players.filter(player => !player.folded);
    if (nonFoldedPlayers.length === 1) {
      this.declareWinner(nonFoldedPlayers);
      return this.prepReturn();
    }
    const index = this.currentPlayerIndex;
    this.checkNextPlayer();
    if (index === this.lastRaisePlayerIndex) {
      this.lastRaisePlayerIndex = this.currentPlayerIndex;
    }

    return this.prepReturn();
  }

  public allInHandler = () => {
    const allInAmount = this.players[this.currentPlayerIndex].chips + this.players[this.currentPlayerIndex].currentBet;
    if (allInAmount > this.currentBet) {
      this.currentBet = allInAmount;
      this.lastRaisePlayerIndex = this.currentPlayerIndex;
    }
    this.players[this.currentPlayerIndex].setCurrentBet(allInAmount);
    this.players[this.currentPlayerIndex].setChips(0);

    this.pot += allInAmount;

    this.checkNextPlayer();
    return this.prepReturn();
  }
  /* End Action Handlers */


  /* Helper Functions */
  public checkNextPlayer = () => {
    // const nextPlayerIndex = this.currentPlayerIndex + 1 > this.players.length - 1 ? 0 : this.currentPlayerIndex + 1;
    const nextPlayerIndex = this.getNextActiveIndex(this.players, this.currentPlayerIndex);
    if (nextPlayerIndex === this.lastRaisePlayerIndex) {
      this.updateRoundState();
    } else {
      this.nextPlayersTurn();
    }
  }

  public nextPlayersTurn = () => {
    do {
      if (this.currentPlayerIndex >= this.players.length - 1) {
        this.currentPlayerIndex = 0;
      } else {
        this.currentPlayerIndex++;
      }
    } while ((this.players[this.currentPlayerIndex] ?? this.players[0]).folded === true || (this.players[this.currentPlayerIndex] ?? this.players[0]).busted === true)
  }

  public getLeftOfDealer = () => {
    this.currentPlayerIndex = this.getNextActiveIndex(this.players, this.dealerIndex);
    this.lastRaisePlayerIndex = this.getNextActiveIndex(this.players, this.dealerIndex);
  }

  public drawCard = () => {
    return this.deck.pop() as Card;
  }
  /* End Helper Functions */


  /* Game State Functions */
  public updateRoundState = () => {
    if (this.gameState === 'preflop') {
      this.gameState = 'flop';
      this.drawCard(); // burn card
      const flopCard1: Card = this.drawCard();
      const flopCard2: Card = this.drawCard();
      const flopCard3: Card = this.drawCard();
      this.tableCards = [flopCard1, flopCard2, flopCard3];
      this.getLeftOfDealer();
    } else if (this.gameState === 'flop') {
      this.gameState = 'turn';
      this.drawCard(); // burn card
      const turnCard = this.drawCard();
      this.tableCards = [...this.tableCards, turnCard];
      this.getLeftOfDealer();

    } else if (this.gameState === 'turn') {
      this.gameState = 'river';
      this.drawCard(); // burn card
      const riverCard = this.drawCard();
      this.tableCards = [...this.tableCards, riverCard];
      this.getLeftOfDealer();
    } else {
      const nonFoldedPlayers = this.players.filter(player => !player.folded);
      const finalHands = nonFoldedPlayers.map(player => ({ ...getHandRanking(player, this.tableCards)}));
      finalHands.sort((a, b) => {
        const handA = handOrder.indexOf(a.highestHand);
        const handB = handOrder.indexOf(b.highestHand);

        return handB - handA;
      });
      // const highestPlayers = finalHands.filter(hand => hand.highestHand === highestHand);
      const winners = contestHands(finalHands);
      this.declareWinner(winners);
    }
  }

  public declareWinner = (winners: nestedPlayers) => {
    console.log('🚀 ~ Game ~ winners:', winners);

    

    if (winners.length === 0) {
      console.error('Got 0 winners')
      return;
    }
    this.winners = winners;

    const getMaxWinning = (player: Player) => {
      const players = this.players.filter(p => p.name !== player.name);
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

    winners.forEach(winnerGroup => {
      if (Array.isArray(winnerGroup)) {
        winnerGroup.map(player => {
          const maxWinning = getMaxWinning(player);
          const wonChips = Math.round(maxWinning / winnerGroup.length) >= this.pot ? Math.round(maxWinning / winnerGroup.length) : Math.round(this.pot / winnerGroup.length);
          player.setChips(player.chips + wonChips);
          this.pot -= wonChips;
        });
      } else {
        // give what they can get from this
        const maxWinning = getMaxWinning(winnerGroup);
        const wonChips = maxWinning <= this.pot ? Math.round(maxWinning) : this.pot;
        winnerGroup.setChips(winnerGroup.chips + wonChips);
        this.pot -= wonChips;
      }
    })


    this.gameState = 'end';
    // Prepping for next round
    this.dealerIndex = this.getNextActiveIndex(this.players, this.dealerIndex);
    this.players.forEach(player => {
      if (player.chips <= 0) {
        player.SetBusted(true);
      }
    })
    // this.prepNextRound();
  }

  public prepNextRound = () => {
    // this.dealerIndex = this.dealerIndex === this.players.length - 1 ? 0 : this.dealerIndex + 1;
    // this.players.forEach(player => {
    //   player.SetFolded(false);
    //   player.resetCurrentBet();
    // });
  }
  /* End Game State Functions */
}

export default Game;


