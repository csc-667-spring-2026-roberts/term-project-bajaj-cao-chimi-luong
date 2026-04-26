import { EventTypes, type GameListItem } from "../types/types.js";

const source = new EventSource("/api/sse");

const createGameButton = document.querySelector<HTMLButtonElement>("#create-game");
const gamesList = document.querySelector<HTMLDivElement>("#games-list");
const gameCardTemplate = document.querySelector<HTMLTemplateElement>("#game-card-template");

function renderGame(game: GameListItem): HTMLElement {
  const clone = gameCardTemplate?.content.cloneNode(true) as DocumentFragment;

  const idEl = clone.querySelector("[data-game-id]");
  const creatorEl = clone.querySelector("[data-creator]");
  const playerCountEl = clone.querySelector("[data-player-count]");
  const statusEl = clone.querySelector("[data-status]");
  const form = clone.querySelector("form");

  if (idEl) idEl.textContent = `Game #${String(game.id)}`;
  if (creatorEl) creatorEl.textContent = game.creator_email;
  if (playerCountEl) playerCountEl.textContent = `${String(game.player_count)} player(s)`;
  if (statusEl) statusEl.textContent = game.status;
  if (form) form.action = `/api/games/${String(game.id)}/join`;

  return clone.firstElementChild as HTMLElement;
}

async function loadGames(): Promise<void> {
  const response = await fetch("/api/games");
  const { games } = (await response.json()) as { games: GameListItem[] };

  if (!gamesList) {
    return;
  }

  if (games.length === 0) {
    gamesList.innerHTML = "<p>No games created yet. Create one!</p>";
    return;
  }

  gamesList.replaceChildren(...games.map(renderGame));
}

async function createGame(): Promise<void> {
  const response = await fetch("/api/games", {
    method: "post",
  });

  if (!response.ok) {
    console.error("Failed to create game");
    return;
  }

  await loadGames();
}

createGameButton?.addEventListener("click", () => void createGame());

source.onmessage = (event: MessageEvent<string>): void => {
  const data = JSON.parse(event.data) as { type: EventTypes };

  console.log({ data });

  if (data.type === EventTypes.games_updated) {
    void loadGames();
  }
};

source.onopen = (): void => {
  void loadGames();
};
