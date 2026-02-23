/* Game State Types/Interfaces */
import { Player, PlayerID } from "./player.js";
import { Card, CardId } from "./cards.js";

export type GameRoomID = number;

export type GameStatus = "LOBBY" | "FINISHED" | "ACTIVE";

export type ResponseNeeded =
  // Regular game flow
  | { kind: "NONE" }

  //Decision needed states
  | { kind: "DEFUSE_EXPLODING_KITTEN"; playerId: PlayerID; ekCardID: CardId }
  | { kind: "REINSERT_EXPLODING_KITTEN"; playerID: PlayerID; deckSize: number }
  | { kind: "FAVOR"; askingPlayerID: PlayerID; givingPlayerID: PlayerID }
  | { kind: "CHOOSE A FAVOR"; stealingPlayerID: PlayerID; victimPlayerID: PlayerID };
export type Countdown = { kind: "PAUSED" } | { kind: "RUNNING"; endsAtMs: number };

export interface GameRoom {
  status: GameStatus; //  Lobby, Active, Finished
  //Lobby
  id: GameRoomID; //  The Join Code to invite friends
  players: Player[]; //  List of players in Game Room
  freshDeck: Card[];
  deck?: Card[];
  countdown: Countdown;
  //ACTIVE GAME
  previousTurnPlayerID?: PlayerID;
  currentTurnPlayerIndex?: PlayerID;
  turnsRemaining?: number;
  responseNeeded?: ResponseNeeded;

  //INACTIVE
  winningPlayer?: PlayerID;
}
