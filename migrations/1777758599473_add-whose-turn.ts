import { MigrationBuilder, PgType } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('games', {
    current_turn_user_id: {
      type: PgType.INTEGER,
      notNull: false,
      references: 'users',
      onDelete: 'SET NULL',
    }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('games', 'current_turn_user_id');
}