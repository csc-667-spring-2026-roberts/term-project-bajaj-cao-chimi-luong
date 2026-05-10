import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
        INSERT INTO location_types (location) VALUES
            ('hand'),
            ('deck'),
            ('discard'),
            ('removed')
        ON CONFLICT DO NOTHING;
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
        DELETE FROM location_types 
        WHERE location IN ('hand', 'deck', 'discard', 'removed');
    `);
}
