import { MigrationBuilder, PgType } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("pending_action", [
    "drew_exploding_kitten",
    "re_insert_into_deck",
    "choose_target_player",
    "choose_card_in_hand",
  ]);

  pgm.createTable("pending_actions", {
    id: "id",
    game_id: {
      type: PgType.INTEGER,
      notNull: true,
      references: "games",
      onDelete: "CASCADE",
    },
    acting_user_id: {
      type: PgType.INTEGER,
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    target_user_id: {
      type: PgType.INTEGER,
      notNull: false,
      references: "users",
      onDelete: "CASCADE",
    },
    action: {
      type: "pending_action",
      notNull: true,
    },
    resolved: {
      type: PgType.BOOLEAN,
      notNull: true,
      default: false,
    },
    created_at: {
      type: PgType.TIMESTAMP,
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("pending_actions");
  pgm.dropType("pending_action");
}
