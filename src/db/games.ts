import { Game, GameListItem } from "../types/types.js";
import db from "./connection.js";

const create = async (user_id: number): Promise<Game> => {
  const game = await db.one<Game>("INSERT INTO games DEFAULT VALUES RETURNING *");

  await db.none("INSERT INTO game_users (game_id, user_id) VALUES ($1, $2)", [game.id, user_id]);

  return game;
};

const list = async (): Promise<GameListItem[]> =>
  db.any<GameListItem>(
    `SELECT 
        g.id, 
        g.status, 
        g.created_at, 
        u.email AS creator_email,
        (SELECT COUNT(*)::int FROM game_users WHERE game_id = g.id) AS player_count
     FROM games g
     JOIN game_users gu ON g.id = gu.game_id
     JOIN users u ON gu.user_id = u.id
     WHERE gu.joined_at = (
        SELECT MIN(joined_at) FROM game_users WHERE game_id = g.id
     )
     ORDER BY g.created_at DESC`,
  );

const join = async (gameId: number, userId: number): Promise<void> => {
  await db.none(
    "INSERT INTO game_users (game_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [gameId, userId],
  );
};

export default { create, list, join };
