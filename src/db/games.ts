import { Game, GameListItem, GameUserState } from "../types/types.js";
import db from "./connection.js";

const create = async (user_id: number): Promise<Game> => {
  const game = await db.one<Game>("INSERT INTO games DEFAULT VALUES RETURNING *");

  await db.none("INSERT INTO game_users (game_id, user_id, seat) VALUES ($1, $2, 0)", [
    game.id,
    user_id,
  ]);

  await db.none(
    `
    INSERT INTO game_cards (game_id, card_id, user_id, pile_position)
    SELECT $1, cards.id, NULL, ROW_NUMBER() OVER (ORDER BY RANDOM()) FROM cards
    `,
    [game.id],
  );

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
    "INSERT INTO game_users (game_id, user_id, seat) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING",
    [gameId, userId],
  );
};

const playerCount = async (gameId: number): Promise<number> => {
  const result = await db.one<{ count: number }>(
    "SELECT COUNT(*)::int FROM game_users WHERE game_id=$1",
    [gameId],
  );

  return result.count;
};

const DEAL_SQL = `
  UPDATE game_cards
  SET user_id=$1
  WHERE game_id=$2
  AND card_id IN (
    SELECT card_id FROM game_cards
    WHERE game_id=$2 AND user_id IS NULL
    ORDER BY random()
    LIMIT 26
  )
`;

const deal = async (gameId: number): Promise<void> => {
  const [playerOne, playerTwo] = await db.many<{ user_id: number }>(
    "SELECT user_id FROM game_users WHERE game_id=$1 LIMIT 2",
    [gameId],
  );

  await db.none(DEAL_SQL, [playerOne?.user_id, gameId]);
  await db.none(DEAL_SQL, [playerTwo?.user_id, gameId]);
};

const GAME_STATE_SQL = `
  SELECT
    users.id AS user_id,
    users.email,
    users.gravatar_url,
    game_users.seat,
    COUNT(game_cards.card_id)::int AS card_count
  FROM game_users
  JOIN users ON users.id=game_users.user_id
  LEFT JOIN game_cards
    ON game_cards.user_id=users.id AND game_cards.game_id=$1
  WHERE game_users.game_id=$1
  GROUP BY users.id, game_users.seat
  ORDER BY game_users.seat ASC
`;

const getPlayers = async (gameId: number): Promise<{ user_id: number }[]> =>
  db.any("SELECT user_id FROM game_users WHERE game_id=$1", [gameId]);

const state = async (gameId: number): Promise<GameUserState[]> =>
  db.many<GameUserState>(GAME_STATE_SQL, [gameId]);

export default { create, list, join, playerCount, deal, getPlayers, state };
