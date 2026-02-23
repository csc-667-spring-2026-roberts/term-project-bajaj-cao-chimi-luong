import { CardType } from "./types.js";

//A fresh deck before dealing and inserting
export const NEW_DECK_COUNT: Record<CardType, number> = {
  DEFUSE: 0,
  EXPLODING_KITTEN: 0,
  NOPE: 5,
  ATTACK: 4,
  SKIP: 4,
  SHUFFLE: 4,
  SEE_THE_FUTURE: 5,
  FAVOR: 4,
  DRAW_FROM_BOTTOM: 4,
};
//Cards that need to be dealt or inserted at the start
export const NEW_INSERTS_COUNT: Record<CardType, number> = {
  ATTACK: 0,
  DRAW_FROM_BOTTOM: 0,
  FAVOR: 0,
  NOPE: 0,
  SEE_THE_FUTURE: 0,
  SHUFFLE: 0,
  SKIP: 0,
  EXPLODING_KITTEN: 4,
  DEFUSE: 6,
};

/*  Server configuration  */
//  Lobby
export const MAX_PLAYERS_PER_ROOM = 4;
export const MIN_PLAYERS = 2;
export const TIMEOUT_PLAYER_JOIN = 15;

//  New Game Initialization Configuration
export const NUMBER_OF_CARDS_DEALT_PER_PLAYER = 7;
