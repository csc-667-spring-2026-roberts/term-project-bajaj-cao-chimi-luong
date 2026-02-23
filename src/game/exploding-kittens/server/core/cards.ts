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
