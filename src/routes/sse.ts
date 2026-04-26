import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import SSE from "../sse.js";

const router = Router();

router.get("/", requireAuth, (request, response) => {
  const userId = request.session.user?.id;
  if (!userId) {
    response.status(401).end();
    return;
  }

  const gameIdParam = typeof request.query.gameId === "string" ? request.query.gameId : undefined;
  const gameId = gameIdParam ? parseInt(gameIdParam) : undefined;

  const clientId = SSE.addClient(response, userId, gameId);

  console.log(`SSE client ${String(clientId)} connected (user ${String(userId)})`);

  request.on("close", () => {
    SSE.removeClient(clientId);
  });
});

export default router;
