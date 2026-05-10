import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    INSERT INTO initiating_reason_types (reason) VALUES ('FAVOR');
    UPDATE messages SET initiating_reason = 'FAVOR' WHERE initiating_reason = 'STEAL';
    DELETE FROM initiating_reason_types WHERE reason = 'STEAL';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    INSERT INTO initiating_reason_types (reason) VALUES ('STEAL');
    UPDATE messages SET initiating_reason = 'STEAL' WHERE initiating_reason = 'FAVOR';
    DELETE FROM initiating_reason_types WHERE reason = 'FAVOR';
  `);
}
