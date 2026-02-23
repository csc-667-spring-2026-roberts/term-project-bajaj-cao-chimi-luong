import { GameRoom } from "./game-room.js";
import { NUMBER_OF_CARDS_DEALT_PER_PLAYER } from "./game-config.js";

export function startGame(gameRoom: GameRoom): GameRoom {
  //todo catch errors for edge cases

  //Shuffle fresh deck
  const shuffledFreshDeck = [...gameRoom.freshDeck];
  const numberOfExplodingKittens = gameRoom.players.length - 1;
  //Todo add defuses to deck

  //deal out defuses and 7 fresh cards
  let defuseIDcounter = 0;
  for (const player of gameRoom.players) {
    player.hand.push({
      id: `DEFUSE-${(defuseIDcounter++).toString()}`,
      type: "DEFUSE",
    });
  }

  for (let round = 0; round < NUMBER_OF_CARDS_DEALT_PER_PLAYER; round++) {
    for (const player of gameRoom.players) {
      const card = shuffledFreshDeck.pop();
      if (!card) throw new Error("Deck ran out while dealing");
      player.hand.push(card);
    }
  }
  for (const player of gameRoom.players) {
    console.log(player.hand);
  }

  const gameDeck = [...shuffledFreshDeck];
  for (let i = 0; i < numberOfExplodingKittens; i++) {
    gameDeck.push({ id: `EXPLODING_KITTEN-${i.toString()}`, type: "EXPLODING_KITTEN" });
  }
  console.log(gameDeck);
  return {
    ...gameRoom,
    status: "ACTIVE",
    countdown: { kind: "PAUSED" },
    deck: gameDeck,
    currentTurnPlayerIndex: 0,
    turnsRemaining: 1,
    responseNeeded: { kind: "NONE" },
  };
}
