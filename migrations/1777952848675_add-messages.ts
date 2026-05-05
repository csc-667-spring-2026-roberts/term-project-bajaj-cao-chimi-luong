import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
        INSERT INTO choose_what_types (type) VALUES
            ('OPPONENT'),
            ('CARD'),
            ('POSITION_IN_DECK'),
            ('ACKNOWLEDGE'),
            ('NONE')
        ON CONFLICT DO NOTHING;
    `);

  pgm.sql(`
        INSERT INTO initiating_reason_types (reason) VALUES
            ('STEAL'),
            ('SLAP'),
            ('DEFUSE'),
            ('RE_INSERT'),
            ('DEFUSED_SUCCESSFULLY'),
            ('SEE_THE_FUTURE'),
            ('WINNING'),
            ('EXPLODED'),
            ('NONE')
        ON CONFLICT DO NOTHING;
    `);

  pgm.sql(`
    INSERT INTO messages (choose_what, initiating_reason, message_for_user_acting, message_everyone_else) VALUES
                                                                                                            ('OPPONENT',         'STEAL',                'Choose another player to steal from',  'Waiting for...'),
                                                                                                            ('CARD',             'STEAL',                'Choose a card to give',                'Waiting for...'),
                                                                                                            ('OPPONENT',         'SLAP',                 'Choose a player to slap',              'Waiting for...'),
                                                                                                            ('CARD',             'DEFUSE',               'You must defuse now!',                 '...Is defusing the kitten'),
                                                                                                            ('NONE',             'NONE',                 'Its your turn',                        '{player_name}s Turn'),
                                                                                                            ('POSITION_IN_DECK', 'DEFUSED_SUCCESSFULLY', 'Please choose position in deck',       '{player_name} is re-inserting the exploding kitten'),
                                                                                                            ('ACKNOWLEDGE',      'SEE_THE_FUTURE',       'Press OK when done viewing',           '{player_name} is seeing the future'),
                                                                                                            ('ACKNOWLEDGE',      'WINNING',              'You won!',                             '{player_name} won!'),
                                                                                                            ('ACKNOWLEDGE',      'EXPLODED',             'You exploded!',                        '{player_name} exploded!')
      ON CONFLICT DO NOTHING;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DELETE FROM messages
    WHERE (choose_what, initiating_reason) IN (
                                               ('OPPONENT',         'STEAL'),
                                               ('CARD',             'STEAL'),
                                               ('OPPONENT',         'SLAP'),
                                               ('CARD',             'DEFUSE'),
                                               ('NONE',             'NONE'),
                                               ('POSITION_IN_DECK', 'DEFUSED_SUCCESSFULLY'),
                                               ('ACKNOWLEDGE',      'SEE_THE_FUTURE'),
                                               ('ACKNOWLEDGE',      'WINNING'),
                                               ('ACKNOWLEDGE',      'EXPLODED')
      );
  `);

  pgm.sql(`
        DELETE FROM initiating_reason_types 
        WHERE reason IN ('STEAL', 'SLAP', 'DEFUSE', 'RE_INSERT', 'DEFUSED_SUCCESSFULLY', 'SEE_THE_FUTURE', 'WINNING', 'EXPLODED', 'NONE');
    `);

  pgm.sql(`
        DELETE FROM choose_what_types 
        WHERE type IN ('OPPONENT', 'CARD', 'POSITION_IN_DECK', 'ACKNOWLEDGE', 'NONE');
    `);
}