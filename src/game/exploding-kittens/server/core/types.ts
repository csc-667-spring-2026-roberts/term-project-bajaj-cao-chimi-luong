/* Card Types/Interfaces */
export type CardId = string;

export type CardType =
  | "EXPLODING_KITTEN"
  | "DEFUSE"
  | "NOPE"
  | "ATTACK"
  | "SKIP"
  | "SHUFFLE"
  | "SEE_THE_FUTURE"
  | "FAVOR"
  | "DRAW_FROM_BOTTOM";

export interface Card {
  id: CardId;
  type: CardType;
}

/* Player Types/Interfaces */
export type PlayerID = number;
export type PlayerAvatarName = string;

export interface Player {
  id: PlayerID;
  avatarName: PlayerAvatarName;
  hand?: Card[];
  alive?: boolean;
}

/* Game State Types/Interfaces */
export type GameRoomID = number;

export type GameStatus = "LOBBY" | "FINISHED" | "ACTIVE";

export type TurnState =
  // Regular game flow
  | { kind: "NONE" }

  //Decision needed states
  | { kind: "DEFUSE_EXPLODING_KITTEN"; playerId: PlayerID; ekCardID: CardId }
  | { kind: "REINSERT_EXPLODING_KITTEN"; playerID: PlayerID; deckSize: number }
  | { kind: "FAVOR"; askingPlayerID: PlayerID; givingPlayerID: PlayerID }
  | { kind: "CHOOSE A FAVOR"; stealingPlayerID: PlayerID; victimPlayerID: PlayerID };

export interface GameRoom {
  status: GameStatus; //  Lobby, Active, Finished
  //Lobby
  id: GameRoomID; //  The Join Code to invite friends
  players: Player[]; //  List of players in Game Room
  playerCount: number; //  Number of Players
  freshDeck: Card[];
  //ACTIVE GAME
  previousTurnPlayerID?: PlayerID;
  currentTurnPlayerID?: PlayerID;
  currentTurnState?: TurnState;

  //INACTIVE
  winningPlayer?: PlayerID;
}
