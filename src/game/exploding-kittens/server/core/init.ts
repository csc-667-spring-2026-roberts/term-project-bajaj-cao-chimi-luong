import { Card, GameRoom, GameRoomID, Player } from "./types.js";
import { NEW_DECK_COUNT } from "./game-config.js";

function buildNewDeck(): Card[] {
  const deck: Card[] = [];
  for (const [type, count] of Object.entries(NEW_DECK_COUNT) as [Card["type"], number][]) {
    for (let i = 1; i <= count; i++) {
      deck.push({
        id: type + `-${i.toString()}`,
        type: type,
      });
    }
  }
  return deck;
}

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
