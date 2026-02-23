/* Player Types/Interfaces */
import { Card } from "./cards.js";

export type PlayerID = number;
export type PlayerAvatarName = string;

export interface Player {
  id: PlayerID;
  avatarName: PlayerAvatarName;
  hand?: Card[];
  alive?: boolean;
}
