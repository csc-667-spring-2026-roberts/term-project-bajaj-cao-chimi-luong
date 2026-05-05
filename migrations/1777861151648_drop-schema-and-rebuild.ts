import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {

  pgm.dropTable('pending_actions', { ifExists: true });
  pgm.dropTable('messages',                   { ifExists: true });
  pgm.dropTable('game_cards',                 { ifExists: true });
  pgm.dropTable('game_users',                 { ifExists: true });
  pgm.dropTable('games',                      { ifExists: true });
  pgm.dropTable('users',                      { ifExists: true });
  pgm.dropTable('cards',                      { ifExists: true });
  pgm.dropTable('choose_what_types',          { ifExists: true });
  pgm.dropTable('initiating_reason_types',    { ifExists: true });
  pgm.dropTable('card_location',             { ifExists: true });
  pgm.dropTable('game_status',          { ifExists: true });
  pgm.dropTable('card_type',                 { ifExists: true });
  pgm.dropTable('pending_action', {ifExists: true});

  pgm.createTable('card_types', {
    card_type: { type: 'varchar(50)', primaryKey: true }
  });

  pgm.createTable('game_status_types', {
    status: { type: 'varchar(50)', primaryKey: true }
  });

  pgm.createTable('location_types', {
    location: { type: 'varchar(50)', primaryKey: true }
  });

  pgm.createTable('initiating_reason_types', {
    reason: { type: 'varchar(50)', primaryKey: true }
  });

  pgm.createTable('choose_what_types', {
    type: { type: 'varchar(50)', primaryKey: true }
  });

  // =====================
  // STATIC TABLES
  // =====================

  pgm.createTable('cards', {
    id:        { type: 'int', primaryKey: true },
    card_type: { type: 'varchar(50)', notNull: true, references: 'card_types(card_type)' }
  });

  // =====================
  // CORE TABLES
  // =====================

  pgm.createTable('users', {
    id:       { type: 'serial', primaryKey: true },
    email:    { type: 'varchar(255)', notNull: true, unique: true },
    pw_hash:  { type: 'varchar(255)', notNull: true },
    gravatar: { type: 'varchar(500)' }
  });

  pgm.createTable('games', {
    id:                { type: 'serial', primaryKey: true },
    created_by_user:   { type: 'int', notNull: true, references: 'users(id)' },
    created_at:        { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    status:            { type: 'varchar(50)', notNull: true, default: 'WAITING_TO_START', references: 'game_status_types(status)' },
    winner_id:         { type: 'int', references: 'users(id)' },
    current_seat_turn: { type: 'int', notNull: true, default: 0 },
    turns_left:        { type: 'int', notNull: true, default: 1 }
  });

  pgm.addConstraint('games', 'turns_left_min', 'CHECK (turns_left >= 1)');

  pgm.createTable('game_users', {
    game_id:       { type: 'int', notNull: true, references: 'games(id)', onDelete: 'CASCADE' },
    user_id:       { type: 'int', notNull: true, references: 'users(id)' },
    seat_position: { type: 'int', notNull: true },
    is_alive:      { type: 'boolean', notNull: true, default: true }
  });

  pgm.addConstraint('game_users', 'game_users_pkey',        'PRIMARY KEY (game_id, user_id)');
  pgm.addConstraint('game_users', 'unique_seat_per_game',   'UNIQUE (game_id, seat_position)');

  pgm.createTable('game_cards', {
    game_id:      { type: 'int', notNull: true, references: 'games(id)', onDelete: 'CASCADE' },
    card_id:      { type: 'int', notNull: true, references: 'cards(id)' },
    location:     { type: 'varchar(50)', notNull: true, default: 'DECK', references: 'location_types(location)' },
    position:     { type: 'int' },
    user_holding: { type: 'int', references: 'users(id)' }
  });

  pgm.addConstraint('game_cards', 'game_cards_pkey',     'PRIMARY KEY (game_id, card_id)');
  pgm.addConstraint('game_cards', 'hand_user_check',     `CHECK ((location = 'HAND' AND user_holding IS NOT NULL) OR (location <> 'HAND' AND user_holding IS NULL))`);

  // =====================
  // MESSAGING
  // =====================

  pgm.createTable('messages', {
    choose_what:            { type: 'varchar(50)', notNull: true, references: 'choose_what_types(type)' },
    initiating_reason:      { type: 'varchar(50)', notNull: true, references: 'initiating_reason_types(reason)' },
    message_for_user_acting:{ type: 'text', notNull: true },
    message_everyone_else:  { type: 'text', notNull: true }
  });

  pgm.addConstraint('messages', 'messages_pkey', 'PRIMARY KEY (choose_what, initiating_reason)');

  // =====================
  // ACTIONS
  // =====================

  pgm.createTable('actions_pending_resolution', {
    game_id:              { type: 'int', primaryKey: true, references: 'games(id)', onDelete: 'CASCADE' },
    choose_what:          { type: 'varchar(50)', notNull: true, references: 'choose_what_types(type)' },
    decision_needed_from: { type: 'int', notNull: true, references: 'users(id)' },
    initiating_reason:    { type: 'varchar(50)', notNull: true, references: 'initiating_reason_types(reason)' },
    initiated_by_user:    { type: 'int', notNull: true, references: 'users(id)' }
  });


}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('actions_pending_resolution');
  pgm.dropTable('messages');
  pgm.dropTable('game_cards');
  pgm.dropTable('game_users');
  pgm.dropTable('games');
  pgm.dropTable('users');
  pgm.dropTable('cards');
  pgm.dropTable('choose_what_types');
  pgm.dropTable('initiating_reason_types');
  pgm.dropTable('location_types');
  pgm.dropTable('game_status_types');
  pgm.dropTable('card_types');
}