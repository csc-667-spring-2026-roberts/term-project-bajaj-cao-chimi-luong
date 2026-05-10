import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
        INSERT INTO card_types (card_type) VALUES
            ('DEFUSE'),
            ('EXPLODING_KITTEN'),
            ('SKIP'),
            ('SHUFFLE'),
            ('SEE_THE_FUTURE')
        ON CONFLICT DO NOTHING;
    `);

  pgm.sql(`
        INSERT INTO cards (id, card_type) VALUES
            (1,  'DEFUSE'),
            (2,  'DEFUSE'),
            (3,  'DEFUSE'),
            (4,  'DEFUSE'),
            (5,  'DEFUSE'),
            (6,  'DEFUSE'),
            (7,  'EXPLODING_KITTEN'),
            (8,  'EXPLODING_KITTEN'),
            (9,  'EXPLODING_KITTEN'),
            (10, 'EXPLODING_KITTEN'),
            (11, 'SKIP'),
            (12, 'SKIP'),
            (13, 'SKIP'),
            (14, 'SKIP'),
            (15, 'SHUFFLE'),
            (16, 'SHUFFLE'),
            (17, 'SHUFFLE'),
            (18, 'SHUFFLE'),
            (19, 'SEE_THE_FUTURE'),
            (20, 'SEE_THE_FUTURE'),
            (21, 'SEE_THE_FUTURE'),
            (22, 'SEE_THE_FUTURE'),
            (23, 'SEE_THE_FUTURE'),
            (24, 'SEE_THE_FUTURE')
        ON CONFLICT DO NOTHING;
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DELETE FROM cards WHERE id BETWEEN 1 AND 24;`);

  pgm.sql(`
        DELETE FROM card_types 
        WHERE card_type IN ('DEFUSE', 'EXPLODING_KITTEN', 'SKIP', 'SHUFFLE', 'SEE_THE_FUTURE');
    `);
}
