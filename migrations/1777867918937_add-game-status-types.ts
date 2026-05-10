import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
        INSERT INTO game_status_types (status) VALUES
            ('WAITING_TO_START'),
            ('IN_PROGRESS'),
            ('FINISHED')
        ON CONFLICT DO NOTHING;
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
        DELETE FROM game_status_types 
        WHERE status IN ('WAITING_TO_START', 'IN_PROGRESS', 'FINISHED');
    `);
}
