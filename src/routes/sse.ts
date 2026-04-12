import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import SSE from "../sse.js";

const router = Router();

router.get("/", requireAuth, (request, response) => {
  const user = request.session.user;
  if (!user) {
    response.status(401).end();
    return;
  }
  const clientId = SSE.addClient(response, user.id);
  console.log(`SSE client ${String(clientId)} connected (user ${String(user.id)})`);
  request.on("close", () => {
    SSE.removeClient(clientId);
  });
});

export default router;
