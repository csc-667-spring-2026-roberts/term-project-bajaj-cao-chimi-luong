import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType('card_location', ['deck', 'hand', 'discard', 'removed']);

  pgm.addColumn('game_cards', {
    location: {
      type: 'card_location',
      notNull: true,
      default: 'deck',
    }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('game_cards', 'location');
  pgm.dropType('card_location');
}