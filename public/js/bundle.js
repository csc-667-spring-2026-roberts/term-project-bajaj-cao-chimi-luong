"use strict";
(() => {
  // src/client/lobby.ts
  var source = new EventSource("/api/sse");
  source.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type == 0 /* games_updated */) {
      renderGames(data.games);
    }
  };
  source.onerror = () => {
    console.log("SSE connection lost - browser will reconnect automatically");
  };
  source.onopen = () => {
    void loadGames();
  };
  var createGameButton = document.querySelector("#create-game");
  var gamesList = document.querySelector("#games-list");
  var gameCardTemplate = document.querySelector("#game-card-template");
  async function createGame() {
    const response = await fetch("/api/games", {
      method: "post",
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
      console.error("Failed to create game");
      return;
    }
  }
  async function loadGames() {
    const response = await fetch("/api/games");
    const { games } = await response.json();
    renderGames(games);
  }
  function renderGame(game) {
    if (!gameCardTemplate) {
      throw new Error("Missing template #game_card_template");
    }
    const clone = gameCardTemplate.content.cloneNode(true);
    const idEl = clone.querySelector("[data-game-id]");
    const creatorEl = clone.querySelector("[data-creator]");
    const playerCountEl = clone.querySelector("[data-player-count]");
    const statusEl = clone.querySelector("[data-status]");
    const form = clone.querySelector("[data-join]");
    if (!idEl || !creatorEl || !playerCountEl || !statusEl || !form) {
      throw new Error("Template structure is invalid");
    }
    idEl.textContent = `Game #${String(game.id)}`;
    creatorEl.textContent = game.creator_email;
    playerCountEl.textContent = `${String(game.player_count)} player(s)`;
    statusEl.textContent = String(game.status);
    form.action = `/api/games/${String(game.id)}/join`;
    return clone.firstElementChild;
  }
  function renderGames(games) {
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
})();
