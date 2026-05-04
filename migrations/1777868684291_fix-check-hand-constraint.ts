import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint('game_cards', 'hand_user_check');
  pgm.addConstraint('game_cards', 'hand_user_check',
    `CHECK ((location = 'hand' AND user_id IS NOT NULL) OR (location <> 'hand' AND user_id IS NULL))`
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint('game_cards', 'hand_user_check');
  pgm.addConstraint('game_cards', 'hand_user_check',
    `CHECK ((location = 'HAND' AND user_id IS NOT NULL) OR (location <> 'HAND' AND user_id IS NULL))`
  );
}