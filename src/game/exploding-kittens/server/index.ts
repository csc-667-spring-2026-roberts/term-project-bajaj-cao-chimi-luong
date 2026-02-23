import { GameRoom } from "./core/types.js";
import { addPlayerToRoom, initGameRoom } from "./core/init.js";

const gameRoom1: GameRoom = initGameRoom(123, "Kevin");
for (let i = 0; i < 4; i++) {
  if (addPlayerToRoom(gameRoom1, "Marco")) {
    console.log(`Added player`);
  } else console.log("Game room full");
}
console.log(gameRoom1);
