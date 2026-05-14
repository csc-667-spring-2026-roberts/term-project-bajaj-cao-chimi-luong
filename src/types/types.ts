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
  pw_hash: string;
}

export enum GameStatus {
  WAITING_TO_START = "WAITING_TO_START",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
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
  pending_actions = "pending_actions",
  chat_message = "chat_message",
}

export interface GameUserState extends Pick<User, "email" | "gravatar_url"> {
  user_id: number;
  seat_position: number;
  card_count: number;
}

export interface GameState {
  id: number;
  whoami: number;
  players: GameUserState[];
  deck_count: number;
  current_user_id: number;
  pending_action?: PendingAction;
}

export enum CardType {
  EXPLODING_KITTEN = "EXPLODING_KITTEN",
  DEFUSE = "DEFUSE",
  SKIP = "SKIP",
  SHUFFLE = "SHUFFLE",
  SEE_THE_FUTURE = "SEE_THE_FUTURE",
  NOPE = "NOPE",
  FAVOR = "FAVOR",
  ATTACK = "ATTACK",
}

export interface PendingAction {
  game_id: number;
  choose_what: string;
  decision_needed_from: number;
  initiating_reason: string;
  initiated_by_user: number;
}
