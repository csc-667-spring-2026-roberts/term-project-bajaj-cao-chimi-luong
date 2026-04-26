import { MigrationBuilder, PgType } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createType("game_status", ["waiting", "started", "ended"]);

    pgm.createTable("games", {
        id: "id",
        status: {
            type: "game_status",
            notNull: true,
            default: "waiting"
        },
        created_at: {
            type: `${PgType.TIMESTAMP}`,
            notNull: true,
            default: pgm.func("CURRENT_TIMESTAMP")
        }
    })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable("games");

    pgm.dropType("game_status");
}
