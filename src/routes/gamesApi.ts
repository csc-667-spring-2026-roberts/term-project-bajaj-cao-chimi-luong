import { Router } from "express";
import Games from "../db/games.js";
import SSE from "../sse.js";
import { EventTypes } from "../types/types.js";

const router = Router();

router.get("/", async (_request, response) => {
  const games = await Games.list();

  response.json({ games });
});

router.post("/", async (request, response) => {
  const userId = request.session.user?.id;
  if (userId) await Games.create(userId);

  const games = await Games.list();
  SSE.broadcast({ type: EventTypes.games_updated, games });

  response.status(201).send();
});

router.post("/:id/join", async (request, response) => {
  const gameId = parseInt(request.params.id);
  const userId = request.session.user?.id;

  if (userId) await Games.join(gameId, userId);
  SSE.broadcast({ type: EventTypes.games_updated, games: await Games.list() });

  response.redirect(`/games/${String(gameId)}`);
});

export default router;
