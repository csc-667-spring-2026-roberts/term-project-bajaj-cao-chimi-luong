import { Router } from "express";
import db from "../db/connection.js";
const router = Router();

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  await db.none("INSERT INTO test_table (message) VALUES ($1)", [
    `Requested ${id} at ${new Date().toLocaleTimeString()} `,
  ]);

  const records = await db.any("SELECT * FROM test_table");

  res.json(records);
});

export default router;
