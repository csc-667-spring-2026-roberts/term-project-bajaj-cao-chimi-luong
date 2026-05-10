import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("game_cards", "user_holding", "user_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("game_cards", "user_id", "user_holding");
}
