import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("game_cards", "location", {
    default: "deck",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("game_cards", "location", {
    default: "DECK",
  });
}
