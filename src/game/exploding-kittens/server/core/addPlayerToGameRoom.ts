import { MAX_PLAYERS_PER_ROOM, MIN_PLAYERS, TIMEOUT_PLAYER_JOIN_MS } from "./game-config.js";
import { Player, PlayerAvatarName } from "./player.js";
import { Countdown, GameRoom } from "./game-room.js";

export let playerIDCounter = 0;

export function addPlayerToGameRoom(
  gameRoom: GameRoom,
  playerAvatarName: PlayerAvatarName,
): GameRoom {
  const nowMs = Date.now();
  if (gameRoom.status != "LOBBY") {
    throw new Error("Cannot join, game in session already");
  }
  if (gameRoom.players.length >= 4) {
    throw new Error("Cannot join, gameroom is full");
  }
  const newPlayer: Player = {
    avatarName: playerAvatarName,
    id: playerIDCounter++,
  };
  const players = [...gameRoom.players, newPlayer];
  if (players.length == MAX_PLAYERS_PER_ROOM) {
    return {
      ...gameRoom,
      players,
      status: "ACTIVE",
      countdown: { kind: "PAUSED" },
    };
  }
  let countdown: Countdown = { kind: "PAUSED" };
  if (players.length >= MIN_PLAYERS) {
    countdown = { kind: "RUNNING" as const, endsAtMs: nowMs + TIMEOUT_PLAYER_JOIN_MS };
  }
  return {
    ...gameRoom,
    players: [...gameRoom.players, newPlayer],
    countdown,
  };
}
