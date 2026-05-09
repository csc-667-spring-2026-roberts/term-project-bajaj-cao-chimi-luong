import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`INSERT INTO choose_what_types (type) VALUES ('SEE_THE_FUTURE')`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DELETE FROM choose_what_types WHERE type = 'SEE_THE_FUTURE'`);
}