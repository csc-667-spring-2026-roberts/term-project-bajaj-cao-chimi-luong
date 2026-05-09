import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`UPDATE messages SET choose_what = 'SEE_THE_FUTURE' WHERE choose_what = 'ACKNOWLEDGE' AND initiating_reason = 'SEE_THE_FUTURE'`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`UPDATE messages SET choose_what = 'ACKNOWLEDGE' WHERE choose_what = 'SEE_THE_FUTURE' AND initiating_reason = 'SEE_THE_FUTURE'`);
}