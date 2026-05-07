import { Game, GameListItem, GameUserState, PendingAction } from "../types/types.js";
import db from "./connection.js";

const create = async (user_id: number): Promise<Game> => {
  const game = await db.one<Game>(`INSERT INTO games (created_by_user) VALUES ($1) RETURNING *`, [
    user_id,
  ]);

  await db.none(`INSERT INTO game_users (game_id, user_id, seat_position) VALUES ($1, $2, 0)`, [
    game.id,
    user_id,
  ]);

  await db.none(
    `INSERT INTO game_cards (game_id, card_id, user_id, position)
     SELECT $1, cards.id, NULL, ROW_NUMBER() OVER (ORDER BY RANDOM())
     FROM cards`,
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
      "INSERT INTO game_users (game_id, user_id, seat_position) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING",
      [gameId, userId],
    );

    // set status to started
    await t.none("UPDATE games SET status = 'IN_PROGRESS' WHERE id = $1", [gameId]);
  });
};

const deal = async (gameId: number): Promise<void> => {
  //SELECTING PLAYERS IN GAME ID
  const players = await db.many<{ user_id: number }>(
    "SELECT user_id FROM game_users WHERE game_id=$1",
    [gameId],
  );
  //PLAYER COUNT
  const playerCount = players.length;

  //TOTAL COUNT DEFUSES IN DECK
  const defuseCount = await db.one<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM game_cards JOIN cards ON cards.id = game_cards.card_id WHERE game_cards.game_id = $1 AND cards.card_type = 'DEFUSE'`,
    [gameId],
  );
  //DEFUSES TO REMOVE
  const defuseRemoveCount = defuseCount.count - playerCount - 2;
  //REMOVE EXTRA DEFUSE
  await db.none(
    `UPDATE game_cards SET location = 'removed'
   WHERE game_id = $1 AND card_id IN (
     SELECT game_cards.card_id FROM game_cards
     JOIN cards ON cards.id = game_cards.card_id
     WHERE game_cards.game_id = $1 AND cards.card_type = 'DEFUSE' AND game_cards.location = 'deck'
     LIMIT $2
   )`,
    [gameId, defuseRemoveCount],
  );

  // give each player 1 defuse
  for (const player of players) {
    await db.none(
      `UPDATE game_cards SET user_id=$1, location='hand'
       WHERE game_id=$2 AND card_id = (
         SELECT gc.card_id FROM game_cards gc
                                  JOIN cards c ON c.id = gc.card_id
         WHERE gc.game_id=$2 AND gc.location='deck' AND c.card_type='DEFUSE'
         LIMIT 1
         )`,
      [player.user_id, gameId],
    );
  }

  // give each player 4 random non-EK non-DEFUSE cards from deck
  for (const player of players) {
    await db.none(
      `UPDATE game_cards SET user_id=$1, location='hand'
       WHERE game_id=$2 AND card_id IN (
         SELECT gc.card_id FROM game_cards gc
         JOIN cards c ON c.id = gc.card_id
         WHERE gc.game_id=$2 AND gc.location='deck'
         AND c.card_type NOT IN ('EXPLODING_KITTEN', 'DEFUSE')
         ORDER BY random()
         LIMIT 4
       )`,
      [player.user_id, gameId],
    );
  }

  // remove extra exploding kittens, keep (playerCount - 1)
  await db.none(
    `UPDATE game_cards SET location='removed'
     WHERE game_id=$1 AND card_id IN (
       SELECT gc.card_id FROM game_cards gc
       JOIN cards c ON c.id = gc.card_id
       WHERE gc.game_id=$1 AND gc.location='deck' AND c.card_type='EXPLODING_KITTEN'
       ORDER BY random()
       OFFSET ($2 - 1)
     )`,
    [gameId, playerCount],
  );

  //set up deck position
  await updateCardPositions(gameId);
};

const updateCardPositions = async (gameId: number): Promise<void> => {
  // reorder deck and discard globally
  for (const location of ["deck", "discard"]) {
    await db.none(
      `UPDATE game_cards SET position = sub.new_pos
        FROM (
         SELECT card_id, ROW_NUMBER() OVER (ORDER BY position ASC) - 1 AS new_pos
         FROM game_cards
         WHERE game_id = $1 AND location = $2
        ) sub
       WHERE game_cards.game_id = $1 AND game_cards.card_id = sub.card_id`,
      [gameId, location],
    );
  }

  // reorder hand per player
  await db.none(
    `UPDATE game_cards SET position = sub.new_pos
     FROM (
       SELECT card_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY position ASC) - 1 AS new_pos
       FROM game_cards
       WHERE game_id = $1 AND location = 'hand'
     ) sub
     WHERE game_cards.game_id = $1 AND game_cards.card_id = sub.card_id`,
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
    game_users.seat_position,
    COUNT(game_cards.card_id)::int AS card_count,
    games.current_seat_turn
  FROM game_users
         JOIN users ON users.id = game_users.user_id
         JOIN games ON games.id = game_users.game_id
         LEFT JOIN game_cards
                   ON game_cards.user_id = users.id AND game_cards.game_id = $1
  WHERE game_users.game_id = $1
  GROUP BY users.id, game_users.seat_position, games.current_seat_turn
  ORDER BY game_users.seat_position ASC
`;

const getPlayers = async (gameId: number): Promise<{ user_id: number }[]> =>
  db.any("SELECT user_id FROM game_users WHERE game_id=$1", [gameId]);

const validateTurn = async (gameId: number, userId: number): Promise<boolean> => {
  const result: { [key: string]: never } | null = await db.oneOrNone(
    `SELECT 1
     FROM game_users gu
     JOIN games g ON gu.game_id = g.id
     WHERE gu.game_id = $1
     AND gu.user_id = $2
     AND gu.seat_position = g.current_seat_turn`,
    [gameId, userId],
  );

  return result !== null;
};

const validateActionResolution = async (gameId: number, userId: number): Promise<boolean> => {
  const result: { [key: string]: never } | null = await db.oneOrNone(
    `SELECT 1 FROM actions_pending_resolution WHERE game_id = $1 AND decision_needed_from = $2`,
    [gameId, userId],
  );
  return result !== null;
};

const validateCardInHand = async (
  gameId: number,
  userId: number,
  cardId: number,
): Promise<boolean> => {
  const result: { [key: string]: never } | null = await db.oneOrNone(
    `SELECT 1 FROM game_cards WHERE game_id = $1 AND user_id = $2 AND card_id = $3 AND location = 'hand'`,
    [gameId, userId, cardId],
  );
  return result !== null;
};

const validateChosenOpponent = async (
  gameId: number,
  userId: number,
  opponentId: number,
): Promise<boolean> => {
  if (userId === opponentId) return false;

  const result = await db.oneOrNone<{ [key: string]: never }>(
    `SELECT 1 FROM game_users WHERE game_id = $1 AND user_id = $2 AND is_alive = true`,
    [gameId, opponentId],
  );
  return result !== null;
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
       ORDER BY position
       LIMIT 1
       )
       RETURNING (SELECT c.card_type FROM cards c WHERE c.id = card_id)`,
    [gameId, userId],
  );
};

const giveCardTo = async (gameId: number, cardId: number, userId: number): Promise<void> => {
  await db.none(`UPDATE game_cards SET user_id = $3 WHERE game_id = $1 AND card_id = $2`, [
    gameId,
    cardId,
    userId,
  ]);
};

const shuffleDeck = async (gameId: number): Promise<void> => {
  await db.none(
    `UPDATE game_cards
     SET position = sub.new_pos
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
    `SELECT gc.card_id AS id, c.card_type AS type FROM game_cards gc
                                            JOIN cards c ON c.id = gc.card_id
     WHERE gc.game_id = $1 AND gc.location = 'hand' AND gc.user_id = $2
     ORDER BY gc.position`,
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
       WHERE gc.game_id = $1 AND gc.location = 'hand' AND gc.user_id = $2 AND c.card_type = $3
       LIMIT 1
       )`,
    [gameId, userId, type],
  );
};

const getInitiatingUser = async (gameId: number): Promise<number> => {
  const result = await db.one<{ initiated_by_user: number }>(
    `SELECT initiated_by_user FROM actions_pending_resolution WHERE game_id = $1`,
    [gameId],
  );
  return result.initiated_by_user;
};

const getDiscard = async (gameId: number): Promise<{ type: string } | null> => {
  return db.oneOrNone<{ type: string }>(
    `SELECT c.card_type FROM game_cards gc
                          JOIN cards c ON c.id = gc.card_id
     WHERE gc.game_id = $1 AND gc.location = 'discard'
     ORDER BY gc.position DESC
       LIMIT 1`,
    [gameId],
  );
};

const advanceTurn = async (gameId: number): Promise<void> => {
  await db.none(
    `UPDATE games
     SET current_seat_turn = COALESCE(
       (SELECT MIN(seat_position)
        FROM game_users
        WHERE game_id = $1
          AND seat_position > (
          SELECT current_seat_turn FROM games WHERE id = $1
        )),
       (SELECT MIN(seat_position)
        FROM game_users
        WHERE game_id = $1)
                             )
     WHERE id = $1`,
    [gameId],
  );
};

const getPendingAction = async (gameId: number): Promise<PendingAction> => {
  return db.one<PendingAction>(`SELECT * FROM actions_pending_resolution WHERE game_id = $1`, [
    gameId,
  ]);
};

const setPendingAction = async (
  gameId: number,
  chooseWhat: string,
  decisionNeededFrom: number,
  initiatingReason: string,
  initiatedByUser: number,
): Promise<void> => {
  await db.none(
    `INSERT INTO actions_pending_resolution (game_id, choose_what, decision_needed_from, initiating_reason, initiated_by_user)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (game_id) DO UPDATE
       SET choose_what = EXCLUDED.choose_what,
           decision_needed_from = EXCLUDED.decision_needed_from,
           initiating_reason = EXCLUDED.initiating_reason,
           initiated_by_user = EXCLUDED.initiated_by_user`,
    [gameId, chooseWhat, decisionNeededFrom, initiatingReason, initiatedByUser],
  );
};

const resolvePendingAction = async (gameId: number): Promise<void> => {
  await db.none(`DELETE FROM actions_pending_resolution WHERE game_id = $1`, [gameId]);
};

const validateChoiceType = async (gameId: number): Promise<string> => {
  const result = await db.one<{ choose_what: string }>(
    `SELECT choose_what FROM actions_pending_resolution WHERE game_id = $1`,
    [gameId],
  );
  return result.choose_what;
};

const setCurrentPlayer = async (gameId: number, userId: number): Promise<void> => {
  await db.none(
    `UPDATE games SET current_seat_turn = (
       SELECT seat_position FROM game_users WHERE game_id = $1 AND user_id = $2
     ) WHERE id = $1`,
    [gameId, userId],
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
  validateActionResolution,
  validateCardInHand,
  advanceTurn,
  giveCardTo,
  getInitiatingUser,
  resolvePendingAction,
  validateChosenOpponent,
  validateChoiceType,
  getPendingAction,
  setPendingAction,
  setCurrentPlayer,
  updateCardPositions,
};
