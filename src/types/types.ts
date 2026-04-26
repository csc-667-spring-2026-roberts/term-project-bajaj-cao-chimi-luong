import { Request } from "express";

export interface TypedRequestBody<T> extends Request {
  body: T;
}

export interface UserLoginRequestBody {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  gravatar_url: string;
  created_at: Date;
}

export interface DbUser extends User {
  password_hash: string;
}

export enum GameStatus {
  waiting = "waiting",
  started = "started",
  ended = "ended",
}

export interface Game {
  id: number;
  status: GameStatus;
  created_at: Date;
}

export interface GameListItem {
  id: number;
  status: GameStatus;
  created_at: Date;
  creator_email: string;
  player_count: number;
}

export enum EventTypes {
  games_updated = "games_updated",
  game_state_updated = "game_state_updated",
}

export interface GameUserState extends Pick<User, "email" | "gravatar_url"> {
  user_id: number;
  seat: number;
  card_count: number;
}

export interface GameState {
  id: number;
  whoami: number;
  players: GameUserState[];
}
