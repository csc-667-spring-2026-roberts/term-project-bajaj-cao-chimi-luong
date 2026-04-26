import { MigrationBuilder, PgType } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable("cards", {
        id: "id",
        rank: { type: PgType.SMALLINT, notNull: true },
        suit: { type: PgType.CHAR, notNull: true }
    });

    pgm.sql("INSERT INTO cards(rank, suit) SELECT r, s FROM generate_series(2, 14) r CROSS JOIN unnest (ARRAY['H','D','C','S']) s")
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable("cards");
}
