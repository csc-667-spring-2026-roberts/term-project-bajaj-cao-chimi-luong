import { Game, GameListItem, GameUserState } from "../types/types.js";
import db from "./connection.js";

const create = async (user_id: number): Promise<Game> => {
  const game = await db.one<Game>("INSERT INTO games DEFAULT VALUES RETURNING *");

  await db.none("INSERT INTO game_users (game_id, user_id, seat) VALUES ($1, $2, 0)", [
    game.id,
    user_id,
  ]);

  // location defaults to 'deck' via the migration DEFAULT
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
  await db.tx(async (t) => {
    // add the player as seat 1
    await t.none(
      "INSERT INTO game_users (game_id, user_id, seat) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING",
      [gameId, userId],
    );

    // set status to started
    await t.none("UPDATE games SET status = 'started' WHERE id = $1", [gameId]);
  });
};

const deal = async (gameId: number): Promise<void> => {
  const players = await db.many<{ user_id: number }>(
    "SELECT user_id FROM game_users WHERE game_id=$1",
    [gameId],
  );
  const playerCount = players.length;

  // give each player 1 defuse — fix: set location = 'hand'
  for (const player of players) {
    await db.none(
      `UPDATE game_cards SET user_id=$1, location='hand'
       WHERE game_id=$2 AND card_id = (
         SELECT gc.card_id FROM game_cards gc
                                  JOIN cards c ON c.id = gc.card_id
         WHERE gc.game_id=$2 AND gc.location='deck' AND c.type='defuse'
         LIMIT 1
         )`,
      [player.user_id, gameId],
    );
  }

  // keep min(2, remaining) defuses in deck, remove the rest
  // fix: filter by location='deck' instead of user_id IS NULL
  await db.none(
    `UPDATE game_cards SET location='removed', user_id=NULL
     WHERE game_id=$1 AND card_id IN (
       SELECT gc.card_id FROM game_cards gc
       JOIN cards c ON c.id = gc.card_id
       WHERE gc.game_id=$1 AND gc.location='deck' AND c.type='defuse'
       ORDER BY random()
       OFFSET LEAST(2, 6 - $2)
     )`,
    [gameId, playerCount],
  );

  // deal 7 random non-EK non-defuse cards to each player
  // fix: filter by location='deck' instead of user_id IS NULL
  for (const player of players) {
    await db.none(
      `UPDATE game_cards SET user_id=$1, location='hand'
       WHERE game_id=$2 AND card_id IN (
         SELECT gc.card_id FROM game_cards gc
                                  JOIN cards c ON c.id = gc.card_id
         WHERE gc.game_id=$2 AND gc.location='deck'
           AND c.type NOT IN ('exploding_kitten', 'defuse')
         ORDER BY random()
         LIMIT 7
         )`,
      [player.user_id, gameId],
    );
  }

  // put (playerCount - 1) exploding kittens in deck, remove the rest
  // fix: filter by location='deck' instead of user_id IS NULL
  await db.none(
    `UPDATE game_cards SET location='removed', user_id=NULL
     WHERE game_id=$1 AND card_id IN (
       SELECT gc.card_id FROM game_cards gc
                                JOIN cards c ON c.id = gc.card_id
       WHERE gc.game_id=$1 AND gc.location='deck' AND c.type='exploding_kitten'
       ORDER BY random()
       OFFSET ($2 - 1)
       )`,
    [gameId, playerCount],
  );

  // set the first turn to seat 0 (the creator)
  await db.none(
    `UPDATE games
     SET current_turn_user_id = (
       SELECT user_id FROM game_users
       WHERE game_id = $1
       ORDER BY seat ASC
       LIMIT 1
       )
     WHERE id = $1`,
    [gameId],
  );
};

const playerCount = async (gameId: number): Promise<number> => {
  const result = await db.one<{ count: number }>(
    "SELECT COUNT(*)::int FROM game_users WHERE game_id=$1",
    [gameId],
  );

  return result.count;
};

const GAME_STATE_SQL = `
  SELECT
    users.id AS user_id,
    users.email,
    users.gravatar_url,
    game_users.seat,
    COUNT(game_cards.card_id)::int AS card_count,
    games.current_turn_user_id
  FROM game_users
         JOIN users ON users.id = game_users.user_id
         JOIN games ON games.id = game_users.game_id
         LEFT JOIN game_cards
                   ON game_cards.user_id = users.id AND game_cards.game_id = $1
  WHERE game_users.game_id = $1
  GROUP BY users.id, game_users.seat, games.current_turn_user_id
  ORDER BY game_users.seat ASC
`;

const getPlayers = async (gameId: number): Promise<{ user_id: number }[]> =>
  db.any("SELECT user_id FROM game_users WHERE game_id=$1", [gameId]);

const validateTurn = async (gameId: number, userId: number): Promise<boolean> => {
  const game = await db.one<{
    status: string;
    current_turn_user_id: number;
  }>("SELECT status, current_turn_user_id FROM games WHERE id = $1", [gameId]);

  if (game.status !== "started") {
    return false;
  }

  if (game.current_turn_user_id !== userId) {
    return false;
  }
  return true;
};

const state = async (gameId: number): Promise<GameUserState[]> =>
  db.many<GameUserState>(GAME_STATE_SQL, [gameId]);

const drawCard = async (gameId: number, userId: number): Promise<{ type: string } | null> => {
  return db.oneOrNone<{ type: string }>(
    `UPDATE game_cards
     SET user_id = $2, location = 'hand'
     WHERE game_id = $1
       AND card_id = (
       SELECT card_id FROM game_cards
       WHERE game_id = $1 AND location = 'deck'
       ORDER BY pile_position
       LIMIT 1
       )
       RETURNING (SELECT c.type FROM cards c WHERE c.id = card_id)`,
    [gameId, userId],
  );
};

const shuffleDeck = async (gameId: number): Promise<void> => {
  await db.none(
    `UPDATE game_cards
     SET pile_position = sub.new_pos
       FROM (
       SELECT card_id, ROW_NUMBER() OVER (ORDER BY random()) AS new_pos
       FROM game_cards
       WHERE game_id = $1 AND location = 'deck'
       ) sub
     WHERE game_cards.game_id = $1 AND game_cards.card_id = sub.card_id`,
    [gameId],
  );
};

const deckCount = async (gameId: number): Promise<number> => {
  const result = await db.one<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM game_cards
     WHERE game_id = $1 AND location = 'deck'`,
    [gameId],
  );
  return result.count;
};

const getHand = async (gameId: number, userId: number): Promise<{ type: string; id: number }[]> => {
  return db.any<{ type: string; id: number }>(
    `SELECT gc.card_id AS id, c.type FROM game_cards gc
                                            JOIN cards c ON c.id = gc.card_id
     WHERE gc.game_id = $1 AND gc.location = 'hand' AND gc.user_id = $2
     ORDER BY gc.pile_position`,
    [gameId, userId],
  );
};

const playCard = async (gameId: number, userId: number, type: string): Promise<void> => {
  await db.none(
    `UPDATE game_cards SET location = 'discard', user_id = NULL
     WHERE game_id = $1 AND user_id = $2
       AND card_id = (
       SELECT gc.card_id FROM game_cards gc
                                JOIN cards c ON c.id = gc.card_id
       WHERE gc.game_id = $1 AND gc.location = 'hand' AND gc.user_id = $2 AND c.type = $3
       LIMIT 1
       )`,
    [gameId, userId, type],
  );
};

const getDiscard = async (gameId: number): Promise<{ type: string } | null> => {
  return db.oneOrNone<{ type: string }>(
    `SELECT c.type FROM game_cards gc
                          JOIN cards c ON c.id = gc.card_id
     WHERE gc.game_id = $1 AND gc.location = 'discard'
     ORDER BY gc.pile_position DESC
       LIMIT 1`,
    [gameId],
  );
};

export default {
  create,
  list,
  join,
  playerCount,
  deal,
  state,
  getPlayers,
  drawCard,
  shuffleDeck,
  deckCount,
  getHand,
  playCard,
  getDiscard,
  validateTurn,
};
