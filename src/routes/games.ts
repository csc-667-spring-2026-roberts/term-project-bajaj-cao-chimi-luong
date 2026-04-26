import { Router } from "express";
import Games from "../db/games.js";
import SSE from "../sse.js";
import { EventTypes } from "../types/types.js";

const router = Router();

// Create a game
router.post("/", async (request, response) => {
  const userId = request.session.user?.id;
  if (!userId) {
    response.redirect("/");
    return;
  }

  const game = await Games.create(userId);
  SSE.broadcast({ type: EventTypes.games_updated, games: await Games.list() });

  response.redirect(`/games/${String(game.id)}`);
});

router.get("/:id", (request, response) => {
  const { id } = request.params;
  const user = request.session.user;

  response.render("game", { gameId: id, user });
});

export default router;
