import { CardType } from "./types.js";

export const NEW_DECK: Record<CardType, number> = {
  EXPLODING_KITTEN: 4,
  DEFUSE: 6,
  NOPE: 5,
  ATTACK: 4,
  SKIP: 4,
  SHUFFLE: 4,
  SEE_THE_FUTURE: 5,
  FAVOR: 4,
  DRAW_FROM_BOTTOM: 4,
};

/*  Server configuration  */
//  Lobby
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
export const TIMEOUT_PLAYER_JOIN = 15;

//  New Game Initialization Configuration
export const NUMBER_OF_CARDS_DEALT_PER_PLAYER = 7;
