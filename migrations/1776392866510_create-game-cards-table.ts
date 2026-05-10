import { MigrationBuilder, PgType } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("game_cards", {
    game_id: { type: PgType.INTEGER, notNull: true, references: "games", onDelete: "CASCADE" },
    card_id: { type: PgType.INTEGER, notNull: true, references: "cards", onDelete: "CASCADE" },
    user_id: { type: PgType.INTEGER, notNull: false, references: "users", onDelete: "CASCADE" },
    pile_position: { type: PgType.INTEGER, notNull: true },
  });

  pgm.addConstraint("game_cards", "game_cards_pkey", { primaryKey: ["game_id", "card_id"] });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game_cards");
}
