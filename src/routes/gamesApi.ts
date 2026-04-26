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

    const count = await Games.playerCount(gameId);
    if (count === 2) {
      await Games.deal(gameId);
    }

    response.redirect(`/games/${String(gameId)}`);
    void broadcastGameState(gameId, await Games.state(gameId));
  } catch (error: unknown) {
    console.error({ error });
    response.redirect("/lobby");
  }
});

router.post("/whoami", (request, response) => {
  const userId = request.session.user?.id;

  response.json({ userId });
});

router.get("/:id/state", async (request, response) => {
  const userId = request.session.user?.id;
  if (!userId) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }

  const gameId = parseInt(request.params.id);
  const players = await Games.state(gameId);
  const deckCount = await Games.deckCount(gameId);

  response.json({
    state: {
      id: gameId,
      whoami: userId,
      players,
      deck_count: deckCount,
    },
  });
});

router.get("/:id/hand", async (request, response) => {
  const userId = request.session.user?.id;
  if (!userId) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }
  const gameId = parseInt(request.params.id);
  const cards = await Games.getHand(gameId, userId);
  response.json({ cards });
});

router.post("/:id/play", async (request, response) => {
  const userId = request.session.user?.id;
  if (!userId) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }

  const gameId = parseInt(request.params.id);
  const { type } = request.body as { type: string };

  await Games.playCard(gameId, userId, type);
  await broadcastGameState(gameId, await Games.state(gameId));
  response.json({ ok: true });
});

router.post("/:id/state", async (request) => {
  const gameId = parseInt(request.params.id);
  const state = await Games.state(gameId);
  await broadcastGameState(gameId, state);
});

const broadcastGameState = async (gameId: number, players: GameUserState[]): Promise<void> => {
  const deck_count = await Games.deckCount(gameId);
  players.forEach((value) => {
    SSE.broadcastToGameUser(gameId, value.user_id, {
      type: EventTypes.game_state_updated,
      state: {
        id: gameId,
        whoami: value.user_id,
        players,
        deck_count,
      },
    });
  });
};

router.post("/:id/draw", async (request, response) => {
  const userId = request.session.user?.id;
  if (!userId) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }

  const gameId = parseInt(request.params.id);
  const card = await Games.drawCard(gameId, userId);
  if (!card) {
    response.status(400).json({ error: "No cards left" });
    return;
  }

  await broadcastGameState(gameId, await Games.state(gameId));
  response.json({ card });
});

router.post("/:id/shuffle", async (request, response) => {
  const gameId = parseInt(request.params.id);
  await Games.shuffleDeck(gameId);
  response.json({ ok: true });
});

export default router;
