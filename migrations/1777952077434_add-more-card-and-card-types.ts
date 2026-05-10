import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
        INSERT INTO card_types (card_type) VALUES
            ('FAVOR'),
            ('NOPE')
        ON CONFLICT DO NOTHING;`);

  pgm.sql(`
        INSERT INTO cards (id, card_type) VALUES
            (25,  'FAVOR'),
            (26,  'FAVOR'),
            (27,  'FAVOR'),
            (28,  'FAVOR'),
            (29,  'FAVOR'),
            (30,  'NOPE'),
            (31,  'NOPE'),
            (32,  'NOPE'),
            (33,  'NOPE'),
            (34,  'NOPE')
        ON CONFLICT DO NOTHING;
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DELETE FROM cards WHERE id BETWEEN 25 AND 34;`);

  pgm.sql(`
        DELETE FROM card_types 
        WHERE card_type IN ('FAVOR', 'NOPE');
    `);
}
