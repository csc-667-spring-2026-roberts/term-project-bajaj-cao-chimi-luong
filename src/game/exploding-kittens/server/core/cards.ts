/* Card Types/Interfaces */
export type CardId = string;

export type CardType =
  | "EXPLODING_KITTEN"
  | "DEFUSE"
  | "NOPE"
  | "ATTACK"
  | "SKIP"
  | "SHUFFLE"
  | "SEE_THE_FUTURE"
  | "FAVOR"
  | "DRAW_FROM_BOTTOM";

export interface Card {
  id: CardId;
  type: CardType;
}

export const NEW_DECK_COUNT: Record<CardType, number> = {
  DEFUSE: 0,
  EXPLODING_KITTEN: 0,
  NOPE: 5,
  ATTACK: 4,
  SKIP: 4,
  SHUFFLE: 4,
  SEE_THE_FUTURE: 5,
  FAVOR: 4,
  DRAW_FROM_BOTTOM: 4,
};
//Cards that need to be dealt or inserted at the start
export const NEW_INSERTS_COUNT: Record<CardType, number> = {
  ATTACK: 0,
  DRAW_FROM_BOTTOM: 0,
  FAVOR: 0,
  NOPE: 0,
  SEE_THE_FUTURE: 0,
  SHUFFLE: 0,
  SKIP: 0,
  EXPLODING_KITTEN: 4,
  DEFUSE: 6,
};

export function buildNewDeck(): Card[] {
  const deck: Card[] = [];
  for (const [type, count] of Object.entries(NEW_DECK_COUNT) as [Card["type"], number][]) {
    for (let i = 1; i <= count; i++) {
      deck.push({
        id: type + `-${i.toString()}`,
        type: type,
      });
    }
  }
  return deck;
}
