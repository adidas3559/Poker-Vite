import {
  createPlayer,
  createGame,
  DealCards,
  raiseHandler as raise,
  callHandler as call,
  checkHandler as check,
  foldHandler as fold,
  allInHandler as allIn,
} from '../backend/GameLogic';
import type { GameState, PlayerState } from '../types/GameState';

const initGame = (): GameState => {
  const players: PlayerState[] = [
    createPlayer('1', 'Blake', 20),
    createPlayer('2', 'Alissa', 20),
    createPlayer('3', 'Stephen', 20),
    createPlayer('4', 'Caitlyn', 20),
    createPlayer('5', 'Ben', 10),
    createPlayer('6', 'Max', 20),
  ]
  return createGame(players);
}

const startNewRound = (game: GameState): GameState => {
  return DealCards(game);
}

const raiseHandler = (game: GameState, betInput: number): GameState => {
  return raise(game, betInput);
}

const callHandler = (game: GameState): GameState => {
  return call(game);
}

const checkHandler = (game: GameState): GameState => {
  return check(game);
}

const foldHandler = (game: GameState): GameState => {
  return fold(game);
}

const allInHandler = (game: GameState): GameState => {
  return allIn(game);
}

export {
  initGame,
  startNewRound,
  raiseHandler,
  callHandler,
  checkHandler,
  foldHandler,
  allInHandler,
}