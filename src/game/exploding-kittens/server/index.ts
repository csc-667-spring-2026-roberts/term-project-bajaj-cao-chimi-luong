import { GameRoom } from "./core/game-room.js";
import { initGameRoom } from "./core/init-game-room.js";
import { addPlayerToGameRoom } from "./core/addPlayerToGameRoom.js";
import { startGame } from "./core/play-game.js";

/*
This file is to test the exploding kittens core
 */

//client requests new room, gets room ID
let gameRoom1: GameRoom = initGameRoom(123);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//client requests to enter the game room using roomID
gameRoom1 = addPlayerToGameRoom(gameRoom1, "KevinA");
console.log(gameRoom1);
//2nd client requests to enter the roomID using roomID (this also sets countdown to start running
console.log(Date.now());
gameRoom1 = addPlayerToGameRoom(gameRoom1, "KevinB");
console.log("added player KevinB");
console.log(gameRoom1);

//minimum amount of clients joined the game room, kicking off the timer TODO stop timer when players count drop below minimum
if (gameRoom1.countdown.kind === "RUNNING") {
  while (Date.now() <= gameRoom1.countdown.endsAtMs) {
    console.log("Counting Down");
    await sleep(1000);
  }
}

//game started
gameRoom1 = startGame(gameRoom1);
console.log(gameRoom1);
//First player in players begins
