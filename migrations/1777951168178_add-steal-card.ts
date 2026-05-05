import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`INSERT INTO card_types (card_type) VALUES ('STEAL') ON CONFLICT DO NOTHING`);
  pgm.sql(`
    INSERT INTO cards (id, card_type) VALUES
      (25, 'STEAL'),
      (26, 'STEAL'),
      (27, 'STEAL'),
      (28, 'STEAL')
    ON CONFLICT DO NOTHING;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DELETE FROM cards WHERE id BETWEEN 25 AND 28;`);
  pgm.sql(`DELETE FROM cards WHERE card_type = 'STEAL'`);
  pgm.sql(`DELETE FROM card_types WHERE card_type = 'STEAL'`);
}