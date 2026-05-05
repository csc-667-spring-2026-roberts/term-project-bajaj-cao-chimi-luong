import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createType("card_type", [
        "exploding_kitten",
        "defuse",
        "attack",
        "skip",
        "favor",
        "shuffle",
        "see_the_future",
        "nope",
        "taco_cat",
        "beard_cat",
        "rainbow_ralphing_cat",
        "cattermelon",
        "hairy_potato_cat"
    ]);

    pgm.createTable("cards", {
        id: "id",
        type: { type: "card_type", notNull: true }
    });

    pgm.sql(`
        INSERT INTO cards (type) SELECT unnest(ARRAY[
            'exploding_kitten','exploding_kitten','exploding_kitten','exploding_kitten',
            'defuse','defuse','defuse','defuse','defuse','defuse',
            'attack','attack','attack','attack',
            'skip','skip','skip','skip',
            'favor','favor','favor','favor',
            'shuffle','shuffle','shuffle','shuffle',
            'see_the_future','see_the_future','see_the_future','see_the_future','see_the_future',
            'nope','nope','nope','nope','nope',
            'taco_cat','taco_cat','taco_cat','taco_cat',
            'beard_cat','beard_cat','beard_cat','beard_cat',
            'rainbow_ralphing_cat','rainbow_ralphing_cat','rainbow_ralphing_cat','rainbow_ralphing_cat',
            'cattermelon','cattermelon','cattermelon','cattermelon',
            'hairy_potato_cat','hairy_potato_cat','hairy_potato_cat','hairy_potato_cat'
        ]::card_type[])
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable("cards");
    pgm.dropType("card_type", { ifExists: true });
}