import { EventTypes, type GameListItem } from "../types/types.js";

const source = new EventSource("/api/sse");

source.onmessage = (event: MessageEvent): void => {
  const data = JSON.parse(event.data);

  if (data.type == EventTypes.games_updated) {
    renderGames(data.games);
  }
};

source.onerror = (): void => {
  console.log("SSE connection lost - browser will reconnect automatically");
};

source.onopen = (): void => {
  void loadGames();
};

const createGameButton = document.querySelector<HTMLButtonElement>("#create-game");
const gamesList = document.querySelector<HTMLDivElement>("#games-list");
const gameCardTemplate = document.querySelector<HTMLTemplateElement>("#game-card-template");

async function createGame(): Promise<void> {
  const response = await fetch("/api/games", {
    method: "post",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error("Failed to create game");
    return;
  }
}

async function loadGames(): Promise<void> {
  const response = await fetch("/api/games");
  const { games } = (await response.json()) as { games: GameListItem[] };

  renderGames(games);
}

function renderGame(game: GameListItem): HTMLElement {
  if (!gameCardTemplate) {
    throw new Error("Missing template #game_card_template");
  }

  const clone = gameCardTemplate.content.cloneNode(true) as DocumentFragment;

  const idEl = clone.querySelector("[data-game-id]");
  const creatorEl = clone.querySelector("[data-creator]");
  const playerCountEl = clone.querySelector("[data-player-count]");
  const statusEl = clone.querySelector("[data-status]");
  const form: Element | null = clone.querySelector("[data-join]");

  if (!idEl || !creatorEl || !playerCountEl || !statusEl || !form) {
    throw new Error("Template structure is invalid");
  }

  idEl.textContent = `Game #${String(game.id)}`;
  creatorEl.textContent = game.creator_email;
  playerCountEl.textContent = `${String(game.player_count)} player(s)`;
  statusEl.textContent = String(game.status);
  (form as HTMLFormElement).action = `/api/games/${String(game.id)}/join`;

  return clone.firstElementChild as HTMLElement;
}

function renderGames(games: GameListItem[]): void {
  if (!gamesList) {
    return;
  }

  if (games.length === 0) {
    gamesList.innerHTML = "<p>No games create yet. Create one!</p>";
    return;
  }

  gamesList.replaceChildren(...games.map(renderGame));
}

createGameButton?.addEventListener("click", () => {
  void createGame();
});
