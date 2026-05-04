import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn('users', 'gravatar', 'gravatar_url');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn('game_cards', 'user_id', 'user_holding');
}