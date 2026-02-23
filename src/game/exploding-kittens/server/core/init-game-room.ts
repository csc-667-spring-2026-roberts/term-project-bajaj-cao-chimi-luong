import { buildNewDeck } from "./cards.js";
import { GameRoom, GameRoomID } from "./game-room.js";
import { Player } from "./player.js";

export function initGameRoom(gameRoomID: GameRoomID): GameRoom {
  const players: Player[] = [];
  return {
    countdown: { kind: "PAUSED" },
    freshDeck: buildNewDeck(),
    status: "LOBBY",
    id: gameRoomID,
    players: players,
  };
}
