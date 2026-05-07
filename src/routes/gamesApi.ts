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

router.get("/:id/validate", async (request, response) => {
  //TESTING API CALL FOR VALIDATION
  const userId = request.session.user?.id;
  const gameId = parseInt(request.params.id);
  if (await Games.validateTurn(gameId, <number>userId)) console.log("TRUE");
  else console.log("FALSE");
  response.json({ ok: true });
});

router.post("/:id/play", async (request, response) => {
  const userId = request.session.user?.id;

  //Not logged in
  if (!userId) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }
  //parse the request: game id
  const gameId = parseInt(request.params.id);
  const { type } = request.body as { type: string };

  if (!(await Games.validateTurn(gameId, userId))) {
    response.status(402).json({ error: "Not your turn" });
    return;
  }

  await Games.playCard(gameId, userId, type);
  await Games.updateCardPositions(gameId);
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
  const gameId = parseInt(request.params.id);
  if (!userId) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!(await Games.validateTurn(gameId, userId))) {
    response.status(401).json({ error: "Not your turn" });
    return;
  }

  const card = await Games.drawCard(gameId, userId);
  if (!card) {
    response.status(400).json({ error: "No cards left" });
    return;
  }
  await Games.updateCardPositions(gameId);
  await Games.advanceTurn(gameId);
  await broadcastGameState(gameId, await Games.state(gameId));
  response.json({ card });
});

router.post("/:id/shuffle", async (request, response) => {
  //Redundant api call. Use /play with shuffle card id
  const gameId = parseInt(request.params.id);
  await Games.shuffleDeck(gameId);
  response.json({ ok: true });
});

router.post("/:id/choose_card", async (request, response) => {
  const gameId = parseInt(request.params.id);
  const userId = request.session.user?.id;
  const { cardId } = request.body as { cardId: number };
  //validate userId exists authenticated
  if (!userId) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }
  //validate user is the correct player to call
  if (!(await Games.validateActionResolution(gameId, userId))) {
    response.status(401).json({ error: "Not your turn" });
    return;
  }

  //validate pending action is calling for a card choice
  if ((await Games.validateChoiceType(gameId)) !== "CARD") {
    response.status(401).json({ error: "Action does not require a card choice" });
    return;
  }

  //validate user has the card being chosen
  if (!(await Games.validateCardInHand(gameId, userId, cardId))) {
    response.status(401).json({ error: "Card doesn't exist in hand" });
    return;
  }

  //Give the card to the new user (FAVOR)
  const newUserId = await Games.getInitiatingUser(gameId);
  await Games.giveCardTo(gameId, cardId, newUserId);

  //Remove Pending Action
  await Games.resolvePendingAction(gameId);
  response.json({ ok: true });
});

router.post("/:id/choose_opponent", async (request, response) => {
  const gameId = parseInt(request.params.id);
  const userId = request.session.user?.id;
  const { opponentId } = request.body as { opponentId: number };
  //validate userId exists authenticated
  if (!userId) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }
  //validate user is the correct user to resolve current pending Resolution
  if (!(await Games.validateActionResolution(gameId, userId))) {
    response.status(401).json({ error: "Not your turn" });
    return;
  }

  //validate that OpponentId is valid choice
  if (!(await Games.validateChosenOpponent(gameId, userId, opponentId))) {
    response.status(401).json({ error: "Not a valid opponent" });
  }

  //SET new pending action accordingly
  const pendingAction = await Games.getPendingAction(gameId);

  //FAVOR
  if (pendingAction.initiating_reason == "FAVOR") {
    await Games.setPendingAction(
      gameId,
      "CARD",
      opponentId,
      pendingAction.initiating_reason,
      pendingAction.initiated_by_user,
    );
  }

  //SLAP
  if (pendingAction.initiating_reason == "SLAP") {
    await Games.setCurrentPlayer(gameId, userId);
    await Games.resolvePendingAction(gameId);
  }

  response.json({ ok: true });
});
export default router;
