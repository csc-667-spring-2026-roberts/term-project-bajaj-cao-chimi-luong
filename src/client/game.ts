import { EventTypes, GameState, GameUserState } from "../types/types.js";

const template = document.querySelector<HTMLTemplateElement>("#player-state-card");
const opponentContainer = document.querySelector<HTMLDivElement>("#opponent");
const meContainer = document.querySelector<HTMLDivElement>("#me");

function renderPlayer(player: GameUserState): HTMLElement {
  const clone = template?.content.cloneNode(true) as DocumentFragment;

  const emailElement = clone.querySelector<HTMLDivElement>(".email");
  const countElement = clone.querySelector<HTMLSpanElement>(".card-count span");

  if (emailElement) {
    emailElement.textContent = player.email;
  }
  if (countElement) {
    countElement.textContent = String(player.card_count);
  }

  return clone.firstElementChild as HTMLElement;
}

function renderState(state: GameState): void {
  if (!opponentContainer || !meContainer) return;

  const opponentState = state.players.find((playerState) => {
    return playerState.user_id !== state.whoami;
  });
  const meState = state.players.find((playerState) => {
    return playerState.user_id === state.whoami;
  });

  if (!opponentState || !meState) {
    console.error("Players not found in game state");
    return;
  }

  opponentContainer.replaceChildren(renderPlayer(opponentState));

  meContainer.querySelector("div")?.replaceWith(renderPlayer(meState));
  const button = meContainer.querySelector<HTMLButtonElement>("#play-button");
  if (!button) {
    console.error("No button found");
    return;
  }

  button.disabled = false;
}

const gameId = document.querySelector<HTMLInputElement>("#GAME_ID");
const source = new EventSource(`/api/sse?gameId=${gameId?.value ?? "-1"}`);

source.onmessage = (event: MessageEvent<string>): void => {
  const data = JSON.parse(event.data) as { type: EventTypes; state?: GameState };
  if (data.type === EventTypes.game_state_updated && data.state) {
    renderState(data.state);
  }
};

async function loadState(): Promise<void> {
  const response = await fetch(`/api/games/${gameId?.value ?? "-1"}/state`);
  const { state } = (await response.json()) as { state: GameState };

  renderState(state);
}

source.onopen = (): void => {
  void loadState();
};
