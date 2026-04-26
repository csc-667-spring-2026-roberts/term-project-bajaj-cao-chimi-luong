import { Router } from "express";
import Games from "../db/games.js";
import SSE from "../sse.js";
import { EventTypes, GameUserState } from "../types/types.js";

const router = Router();

router.get("/", async (_request, response) => {
  const games = await Games.list();

  response.json({ games });
});

router.post("/:id/join", async (request, response) => {
  const userId = request.session.user?.id;
  if (!userId) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }

  const gameId = parseInt(request.params.id);

  const players = await Games.getPlayers(gameId);
  if (players.some((p) => p.user_id === userId)) {
    response.redirect(`/games/${String(gameId)}`);
    return;
  }

  const playerCount = await Games.playerCount(gameId);
  if (playerCount === 2) {
    response.redirect("/lobby");
    return;
  }

  try {
    await Games.join(gameId, userId);
    SSE.broadcast({ type: EventTypes.games_updated, games: await Games.list() });

    await Games.deal(gameId);
    response.redirect(`/games/${String(gameId)}`);

    broadcastGameState(gameId, await Games.state(gameId));
  } catch (error: unknown) {
    console.error({ error });
    response.redirect("/lobby");
  }
});

router.post("/whoami", (request, response) => {
  const userId = request.session.user?.id;

  response.json({ userId });
});

router.post("/:id/state", async (request) => {
  const gameId = parseInt(request.params.id);
  const state = await Games.state(gameId);

  broadcastGameState(gameId, state);
});

const broadcastGameState = (gameId: number, players: GameUserState[]): void => {
  players.forEach((value) => {
    SSE.broadcastToGameUser(gameId, value.user_id, {
      type: EventTypes.game_state_updated,
      state: {
        id: gameId,
        whoami: value.user_id,
        players,
      },
    });
  });
};

export default router;
