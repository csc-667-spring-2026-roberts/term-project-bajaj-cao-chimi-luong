import { MigrationBuilder, PgType } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.addColumn("game_users", {
        seat: { type: PgType.SMALLINT, notNull: true, default: 0 }
    })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropColumn("game_users", "seat");
}
