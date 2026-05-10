import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
        UPDATE messages SET message_everyone_else = 's turn'              WHERE choose_what = 'NONE'             AND initiating_reason = 'NONE';
        UPDATE messages SET message_everyone_else = ' is re-inserting the exploding kitten' WHERE choose_what = 'POSITION_IN_DECK' AND initiating_reason = 'DEFUSED_SUCCESSFULLY';
        UPDATE messages SET message_everyone_else = ' is seeing the future'    WHERE choose_what = 'ACKNOWLEDGE'       AND initiating_reason = 'SEE_THE_FUTURE';
        UPDATE messages SET message_everyone_else = ' won!'                    WHERE choose_what = 'ACKNOWLEDGE'       AND initiating_reason = 'WINNING';
        UPDATE messages SET message_everyone_else = ' exploded!'               WHERE choose_what = 'ACKNOWLEDGE'       AND initiating_reason = 'EXPLODED';
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
        UPDATE messages SET message_everyone_else = '{player_name}s Turn'                          WHERE choose_what = 'NONE'             AND initiating_reason = 'NONE';
        UPDATE messages SET message_everyone_else = '{player_name} is re-inserting the exploding kitten' WHERE choose_what = 'POSITION_IN_DECK' AND initiating_reason = 'DEFUSED_SUCCESSFULLY';
        UPDATE messages SET message_everyone_else = '{player_name} is seeing the future'           WHERE choose_what = 'ACKNOWLEDGE'       AND initiating_reason = 'SEE_THE_FUTURE';
        UPDATE messages SET message_everyone_else = '{player_name} won!'                           WHERE choose_what = 'ACKNOWLEDGE'       AND initiating_reason = 'WINNING';
        UPDATE messages SET message_everyone_else = '{player_name} exploded!'                      WHERE choose_what = 'ACKNOWLEDGE'       AND initiating_reason = 'EXPLODED';
    `);
}
