import { Card, GameRoom, GameRoomID, Player, PlayerAvatarName, PlayerID } from "./types.js";
import { MAX_PLAYERS_PER_ROOM, NEW_DECK_COUNT } from "./game-config.js";

let playerid = 0;

export function getNewPlayerId(): PlayerID {
  return playerid++;
}

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

export function initGameRoom(gameRoomID: GameRoomID, hostPlayerAvatar: PlayerAvatarName): GameRoom {
  const players: Player[] = [];
  players.push({
    avatarName: hostPlayerAvatar,
    id: getNewPlayerId(),
  });

  return {
    freshDeck: buildNewDeck(),
    status: "LOBBY",
    id: gameRoomID,
    players: players,
    playerCount: players.length,
  };
}

export function addPlayerToRoom(
  gameRoom: GameRoom,
  joiningPlayerAvatar: PlayerAvatarName,
): boolean {
  if (gameRoom.players.length < MAX_PLAYERS_PER_ROOM) {
    gameRoom.players.push({
      avatarName: joiningPlayerAvatar,
      id: getNewPlayerId(),
    });
    gameRoom.playerCount = gameRoom.players.length;
    return true;
  }
  return false;
}
