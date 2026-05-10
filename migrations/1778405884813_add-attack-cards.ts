import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`INSERT INTO card_types (card_type) VALUES ('ATTACK')`);

  pgm.sql(`
    INSERT INTO cards (id, card_type) VALUES
      (35, 'ATTACK'),
      (36, 'ATTACK'),
      (37, 'ATTACK'),
      (38, 'ATTACK')
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DELETE FROM cards WHERE card_type = 'ATTACK'`);
  pgm.sql(`DELETE FROM card_types WHERE card_type = 'ATTACK'`);
}