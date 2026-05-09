import { EventTypes, GameState, GameUserState, CardType } from "../types/types.js";

const CARD_META: Record<CardType, string> = {
  EXPLODING_KITTEN: "Exploding Kitten",
  DEFUSE: "Defuse",
  SKIP: "Skip",
  SHUFFLE: "Shuffle",
  SEE_THE_FUTURE: "See the Future",
  NOPE: "Nope",
  FAVOR: "Favor",
};

const CARD_IMAGES: Partial<Record<CardType, string>> = {
  EXPLODING_KITTEN: "/card-sprites/Exploding-Kittens-House-Grenade.webp",
  DEFUSE: "/card-sprites/Exploding-Kittens-Defuse.webp",
  SKIP: "/card-sprites/Exploding-Kittens-Skip.webp",
  SHUFFLE: "/card-sprites/Exploding-Kittens-Shuffle.webp",
  SEE_THE_FUTURE: "/card-sprites/Exploding-Kittens-See-The-Future.webp",
  NOPE: "/card-sprites/Exploding-Kittens-Nope.webp",
  FAVOR: "/card-sprites/Exploding-Kittens-Favor.webp",
};

const template = document.querySelector<HTMLTemplateElement>("#player-state-card");
const opponentContainer = document.querySelector<HTMLDivElement>("#opponent-info");
const meContainer = document.querySelector<HTMLDivElement>("#my-info");
const myHand = document.querySelector<HTMLDivElement>("#my-hand");
const drawButton = document.querySelector<HTMLButtonElement>("#draw-button");
const shuffleButton = document.querySelector<HTMLButtonElement>("#shuffle-button");
const gameIdInput = document.querySelector<HTMLInputElement>("#GAME_ID");
const deckStack = document.querySelector<HTMLDivElement>("#draw-deck");
const deckCountLabel = document.querySelector<HTMLDivElement>("#deck-count-label");
const gameStatus = document.querySelector<HTMLDivElement>("#game-status");
const gameId = gameIdInput?.value ?? "-1";

function setStatus(message: string): void {
  if (gameStatus) gameStatus.textContent = message;
}

function makeCardEl(type: CardType, id: number, animate = true): HTMLElement {
  const label = CARD_META[type];
  const image = CARD_IMAGES[type];

  const wrapper = document.createElement("div");
  wrapper.className = "card-wrapper";
  wrapper.draggable = true;
  wrapper.dataset.cardType = type;
  wrapper.dataset.cardId = String(id);

  const el = document.createElement("div");
  el.className = "card-face";
  el.innerHTML = image
    ? `<img src="${image}" alt="${label}" class="card-img" /><div class="card-name">${label}</div>`
    : `<div class="card-name">${label}</div>`;

  wrapper.appendChild(el);
  if (animate) wrapper.classList.add("card-deal-anim");

  wrapper.addEventListener("dragstart", (e) => {
    e.dataTransfer?.setData("cardType", type);
    wrapper.classList.add("dragging");
  });

  wrapper.addEventListener("dragend", () => {
    wrapper.classList.remove("dragging");
  });

  return wrapper;
}

function renderPlayer(player: GameUserState): HTMLElement {
  const clone = template?.content.cloneNode(true) as DocumentFragment;
  const emailElement = clone.querySelector<HTMLDivElement>(".player-email");
  const countElement = clone.querySelector<HTMLSpanElement>(".player-card-count span");
  const avatarElement = clone.querySelector<HTMLImageElement>(".player-avatar");
  if (emailElement) emailElement.textContent = player.email;
  if (countElement) countElement.textContent = String(player.card_count);
  if (avatarElement && player.gravatar_url) {
    avatarElement.src = player.gravatar_url;
    avatarElement.alt = player.email;
  }
  return clone.firstElementChild as HTMLElement;
}

function renderDeck(count: number): void {
  if (!deckStack) return;
  deckStack.innerHTML = "";
  if (deckCountLabel) deckCountLabel.textContent = `${String(count)} cards`;

  const maxVisible = 10;
  const visible = Math.min(count, maxVisible);

  for (let i = 0; i < visible; i++) {
    const div = document.createElement("div");
    div.className = "card-back-layer";
    const offset = (visible - 1 - i) * 2;
    div.style.top = `${String(offset)}px`;
    div.style.left = `${String(offset)}px`;
    deckStack.appendChild(div);
  }
}

function renderState(state: GameState): void {
  const meState = state.players.find((p) => p.user_id === state.whoami);
  const opponentState = state.players.find((p) => p.user_id !== state.whoami);

  if (meState && meContainer) meContainer.replaceChildren(renderPlayer(meState));
  if (opponentState && opponentContainer)
    opponentContainer.replaceChildren(renderPlayer(opponentState));
  if (!opponentState) {
    setStatus("Waiting for opponent...");
  } else {
    setStatus(`${opponentState.email}'s turn`);
  }

  renderDeck(state.deck_count);
  void renderHand(gameId, state.whoami);

  if (drawButton) drawButton.disabled = !opponentState || state.deck_count === 0;
  if (shuffleButton) shuffleButton.disabled = true;
}

async function drawCard(): Promise<void> {
  if (drawButton) drawButton.disabled = true;
  const res = await fetch(`/api/games/${gameId}/draw`, { method: "POST" });
  if (!res.ok) {
    if (drawButton) drawButton.disabled = false;
    return;
  }
}

const renderedCards = new Set<number>();

async function renderHand(gameId: string, _userId: number): Promise<void> {
  const res = await fetch(`/api/games/${gameId}/hand`);
  const { cards } = (await res.json()) as { cards: { type: CardType; id: number }[] };
  if (!myHand) return;

  let newCardIndex = 0;
  cards.forEach((card) => {
    if (renderedCards.has(card.id)) return;
    renderedCards.add(card.id);
    setStatus("Dealing Cards...");
    const el = makeCardEl(card.type, card.id, false);
    el.style.opacity = "0";
    el.style.animationDelay = `${String(newCardIndex * 0.1)}s`;
    el.classList.add("card-deal-anim");
    myHand.appendChild(el);
    newCardIndex++;
  });

  if (newCardIndex > 0) {
    setTimeout(
      () => {
        setStatus("Your turn");
      },
      newCardIndex * 100 + 400,
    );
  }
}

const discardZone = document.querySelector<HTMLDivElement>("#discard-zone");

if (discardZone) {
  discardZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    discardZone.classList.add("drag-over");
  });

  discardZone.addEventListener("dragleave", () => {
    discardZone.classList.remove("drag-over");
  });

  discardZone.addEventListener("drop", (e) => {
    e.preventDefault();
    discardZone.classList.remove("drag-over");
    const cardType = e.dataTransfer?.getData("cardType");
    if (!cardType) return;
    void playCard(cardType as CardType);
  });
}

async function playCard(type: CardType): Promise<void> {
  const card = myHand?.querySelector<HTMLElement>(`[data-card-type="${type}"]`);
  const cardId = parseInt(card?.dataset.cardId ?? "0");

  const res = await fetch(`/api/games/${gameId}/play`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId: cardId }),
  });
  if (!res.ok) return;

  renderedCards.delete(cardId);
  card?.classList.add("card-play-anim");
  setTimeout(() => card?.remove(), 300);

  if (discardZone) {
    discardZone.innerHTML = "";
    const discardEl = makeCardEl(type, 0, false);
    discardEl.draggable = false;
    discardZone.appendChild(discardEl);
  }
}

async function shuffleDeck(): Promise<void> {
  if (shuffleButton) shuffleButton.disabled = true;
  await fetch(`/api/games/${gameId}/shuffle`, { method: "POST" });
  setStatus("Shuffling Cards...");
  if (shuffleButton) shuffleButton.disabled = false;
}

async function loadState(): Promise<void> {
  const res = await fetch(`/api/games/${gameId}/state`);
  const { state } = (await res.json()) as { state: GameState };
  renderState(state);
}

drawButton?.addEventListener("click", () => void drawCard());
shuffleButton?.addEventListener("click", () => void shuffleDeck());

const source = new EventSource(`/api/sse?gameId=${gameId}`);
source.onopen = (): void => {
  console.log("bhbu");
  void loadState();
};
source.onmessage = (event: MessageEvent<string>): void => {
  const data = JSON.parse(event.data) as { type: EventTypes; state?: GameState };
  if (data.type === EventTypes.game_state_updated && data.state) {
    renderState(data.state);
  }
};
