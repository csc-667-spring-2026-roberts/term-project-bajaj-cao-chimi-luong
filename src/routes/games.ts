import { Router } from "express";

const router = Router();

router.get("/:id", (request, response) => {
  const { id } = request.params;

  response.render("game", { gameId: id });
});

export default router;
