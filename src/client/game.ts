import { CardType, EventTypes, GameState, GameUserState } from "../types/types.js";

const CARD_META: Record<CardType, string> = {
  EXPLODING_KITTEN: "Exploding Kitten",
  DEFUSE: "Defuse",
  SKIP: "Skip",
  SHUFFLE: "Shuffle",
  SEE_THE_FUTURE: "See the Future",
  NOPE: "Nope",
  FAVOR: "Favor",
  ATTACK: "Attack",
};

const CARD_IMAGES: Partial<Record<CardType, string>> = {
  EXPLODING_KITTEN: "/card-sprites/Exploding-Kittens-House-Grenade.webp",
  DEFUSE: "/card-sprites/Exploding-Kittens-Defuse.webp",
  SKIP: "/card-sprites/Exploding-Kittens-Skip.webp",
  SHUFFLE: "/card-sprites/Exploding-Kittens-Shuffle.webp",
  SEE_THE_FUTURE: "/card-sprites/Exploding-Kittens-See-The-Future.webp",
  NOPE: "/card-sprites/Exploding-Kittens-Nope.webp",
  FAVOR: "/card-sprites/Exploding-Kittens-Favor.webp",
  ATTACK: "/card-sprites/Exploding-Kittens-Attack.webp",
};

const template = document.querySelector<HTMLTemplateElement>("#player-state-card");
const opponentContainer = document.querySelector<HTMLDivElement>("#opponent-info");
const meContainer = document.querySelector<HTMLDivElement>("#my-info");
const myHand = document.querySelector<HTMLDivElement>("#my-hand");
const drawButton = document.querySelector<HTMLButtonElement>("#draw-button");
//const shuffleButton = document.querySelector<HTMLButtonElement>("#shuffle-button");
const gameIdInput = document.querySelector<HTMLInputElement>("#GAME_ID");
const deckStack = document.querySelector<HTMLDivElement>("#draw-deck");
const deckCountLabel = document.querySelector<HTMLDivElement>("#deck-count-label");
const gameStatus = document.querySelector<HTMLDivElement>("#game-status");
const gameId = gameIdInput?.value ?? "-1";
let opponentUserId: number | null = null;

async function fetchMessage(): Promise<string> {
  const res = await fetch(`/api/games/${gameId}/message`, {
    method: "GET",
  });
  const { message } = (await res.json()) as { message: string };
  return message;
}

async function setStatus(): Promise<void> {
  const message = await fetchMessage();
  if (gameStatus) gameStatus.textContent = message;
}

function setStatusM(message: string): void {
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

// eslint-disable-next-line complexity
async function renderState(state: GameState): Promise<void> {
  const meState = state.players.find((p) => p.user_id === state.whoami);
  const opponentState = state.players.find((p) => p.user_id !== state.whoami);
  if (opponentState) opponentUserId = opponentState.user_id;
  if (meState && meContainer) meContainer.replaceChildren(renderPlayer(meState));
  if (opponentState && opponentContainer)
    opponentContainer.replaceChildren(renderPlayer(opponentState));
  await setStatus();

  renderDeck(state.deck_count);
  await renderHand(gameId, state.whoami);
  void renderDiscard();

  if (drawButton) {
    drawButton.disabled = !(state.whoami == state.current_user_id && state.deck_count != 0);
  }
  const pendingAction = state.pending_action;
  if (pendingAction) {
    if (
      pendingAction.choose_what == "CARD" &&
      state.whoami == pendingAction.decision_needed_from &&
      pendingAction.initiating_reason != "DEFUSE"
    )
      showCardPicker();
    if (
      pendingAction.choose_what == "OPPONENT" &&
      state.whoami == pendingAction.decision_needed_from
    )
      showOpponentPicker();
    if (
      pendingAction.choose_what == "SEE_THE_FUTURE" &&
      state.whoami == pendingAction.decision_needed_from
    )
      await showSeeTheFuture();
    if (
      pendingAction.choose_what == "CARD" &&
      pendingAction.initiating_reason == "DEFUSE" &&
      state.whoami == pendingAction.decision_needed_from
    )
      showDefusePicker();
  }
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
    if (card.type == CardType.EXPLODING_KITTEN) return;
    renderedCards.add(card.id);
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
        //setStatus("Your turn");
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

  void renderDiscard();
}

async function loadState(): Promise<void> {
  const res = await fetch(`/api/games/${gameId}/state`);
  const { state } = (await res.json()) as { state: GameState };
  await renderState(state);
}

async function renderDiscard(): Promise<void> {
  const res = await fetch(`/api/games/${gameId}/discardPile`);
  const { card } = (await res.json()) as { card: { card_type: CardType } | null };
  if (!discardZone) return;
  discardZone.innerHTML = "";
  if (card) {
    const el = makeCardEl(card.card_type, 0, false);
    el.draggable = false;
    discardZone.appendChild(el);
  }
}

function showCardPicker(): void {
  const picker = document.createElement("div");
  picker.id = "steal-picker";
  picker.innerHTML = `<div class="steal-title">Choose a card!</div>`;

  const cardRow = document.createElement("div");
  cardRow.className = "steal-card-row";

  myHand?.querySelectorAll<HTMLElement>(".card-wrapper").forEach((wrapper) => {
    const cardType = wrapper.dataset.cardType as CardType;
    const cardId = parseInt(wrapper.dataset.cardId ?? "0");
    const clone = makeCardEl(cardType, cardId, false);

    if (cardType === CardType.NOPE) {
      const btnContainer = document.createElement("div");
      btnContainer.className = "card-hover-btns";
      btnContainer.style.display = "none";

      const nopeBtn = document.createElement("button");
      nopeBtn.textContent = "NOPE";
      nopeBtn.addEventListener("click", () => {
        void playCard(CardType.NOPE).then(() => {
          picker.remove();
        });
      });
      const chooseBtn = document.createElement("button");
      chooseBtn.textContent = "CHOOSE";
      chooseBtn.addEventListener("click", () => void chooseCard(cardId, picker));

      btnContainer.appendChild(nopeBtn);
      btnContainer.appendChild(chooseBtn);
      clone.appendChild(btnContainer);

      clone.addEventListener("mouseenter", () => {
        btnContainer.style.display = "flex";
      });
      clone.addEventListener("mouseleave", () => {
        btnContainer.style.display = "none";
      });
    } else {
      clone.addEventListener("click", () => void chooseCard(cardId, picker));
    }

    cardRow.appendChild(clone);
  });

  picker.appendChild(cardRow);
  document.body.appendChild(picker);
}

function showDefusePicker(): void {
  const picker = document.createElement("div");
  picker.id = "steal-picker";
  picker.innerHTML = `<div class="steal-title">You pulled an exploding kitten! Pick a defuse to disarm the kitty</div>`;

  const cardRow = document.createElement("div");
  cardRow.className = "steal-card-row";

  const wrappers = myHand?.querySelectorAll<HTMLElement>(".card-wrapper");

  if (!wrappers || wrappers.length === 0) {
    const explodeBtn = document.createElement("button");
    explodeBtn.textContent = "EXPLODE";
    explodeBtn.className = "steal-player-btn";
    explodeBtn.addEventListener("click", () => {
      void fetch(`/api/games/${gameId}/explode`, { method: "GET" }).then(() => {
        picker.remove();
      });
    });
    picker.appendChild(explodeBtn);
  } else {
    wrappers.forEach((wrapper) => {
      const cardType = wrapper.dataset.cardType as CardType;
      const cardId = parseInt(wrapper.dataset.cardId ?? "0");
      const clone = makeCardEl(cardType, cardId, false);
      clone.addEventListener("click", () => void chooseCard(cardId, picker));
      cardRow.appendChild(clone);
    });
    picker.appendChild(cardRow);
  }

  document.body.appendChild(picker);
}

async function showSeeTheFuture(): Promise<void> {
  const res = await fetch(`/api/games/${gameId}/see_the_future`);
  const { result: cards } = (await res.json()) as {
    result: { card_id: number; card_type: CardType }[];
  };
  const picker = document.createElement("div");
  picker.id = "steal-picker";
  picker.innerHTML = `<div class="steal-title">Top 3 cards of the deck</div>`;

  const cardRow = document.createElement("div");
  cardRow.className = "steal-card-row";

  cards.forEach((card) => {
    const el = makeCardEl(card.card_type, card.card_id, false);
    el.draggable = false;
    cardRow.appendChild(el);
  });

  const doneButton = document.createElement("button");
  doneButton.textContent = "Done";
  doneButton.addEventListener("click", () => {
    void fetch(`/api/games/${gameId}/acknowledge`, { method: "GET" }).then(() => {
      picker.remove();
    });
  });

  picker.appendChild(cardRow);
  picker.appendChild(doneButton);
  document.body.appendChild(picker);
}

async function chooseCard(cardId: number, picker: HTMLElement): Promise<void> {
  picker.remove();
  await fetch(`/api/games/${gameId}/choose_card`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId }),
  });
  renderedCards.delete(cardId);
  myHand?.querySelector<HTMLElement>(`[data-card-id="${String(cardId)}"]`)?.remove();
  setStatusM("Card chosen!");
}

async function chooseOpponent(opponentId: number): Promise<void> {
  await fetch(`/api/games/${gameId}/choose_opponent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opponentId }),
  });
  //setStatusM("Waiting for opponent to give a card...");
}

function showOpponentPicker(): void {
  const picker = document.createElement("div");
  picker.id = "steal-picker";
  picker.innerHTML = `<div class="steal-title">Choose a player to request a card from</div>`;

  const playerRow = document.createElement("div");
  playerRow.className = "steal-card-row";

  const opponents = document.querySelectorAll<HTMLElement>("#opponent-info .player-state");
  opponents.forEach((opponent) => {
    const email = opponent.querySelector<HTMLElement>(".player-email")?.textContent ?? "Opponent";
    const btn = document.createElement("button");
    btn.className = "steal-player-btn";
    btn.textContent = email;
    btn.addEventListener("click", () => {
      picker.remove();
      void chooseOpponent(opponentUserId ?? 0);
    });
    playerRow.appendChild(btn);
  });

  picker.appendChild(playerRow);
  document.body.appendChild(picker);
}

drawButton?.addEventListener("click", () => void drawCard());
//shuffleButton?.addEventListener("click", () => void shuffleDeck());

const source = new EventSource(`/api/sse?gameId=${gameId}`);
source.onopen = (): void => {
  void loadState();
};

source.onmessage = async (event: MessageEvent<string>): Promise<void> => {
  const data = JSON.parse(event.data) as { type: EventTypes; state?: GameState };
  if (data.type === EventTypes.game_state_updated && data.state) {
    await renderState(data.state);
  }
};
