"use strict";
(() => {
  // src/client/lobby.ts
  var source = new EventSource("/api/sse");
  var createGameButton = document.querySelector("#create-game");
  var gamesList = document.querySelector("#games-list");
  var gameCardTemplate = document.querySelector("#game-card-template");
  function renderGame(game) {
    const clone = gameCardTemplate?.content.cloneNode(true);
    const idEl = clone.querySelector("[data-game-id]");
    const creatorEl = clone.querySelector("[data-creator]");
    const playerCountEl = clone.querySelector("[data-player-count]");
    const statusEl = clone.querySelector("[data-status]");
    const form = clone.querySelector("form");
    if (idEl) idEl.textContent = `Game #${String(game.id)}`;
    if (creatorEl) creatorEl.textContent = game.creator_email;
    if (playerCountEl) playerCountEl.textContent = `${String(game.player_count)} player(s)`;
    if (statusEl) statusEl.textContent = String(game.status);
    if (form) form.action = `/api/games/${String(game.id)}/join`;
    return clone.firstElementChild;
  }
  async function loadGames() {
    const response = await fetch("/api/games");
    const { games } = await response.json();
    if (!gamesList) {
      return;
    }
    if (games.length === 0) {
      gamesList.innerHTML = "<p>No games created yet. Create one!</p>";
      return;
    }
    gamesList.replaceChildren(...games.map(renderGame));
  }
  async function createGame() {
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
  source.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log({ data });
    if (data.type === "games_updated" /* games_updated */) {
      void loadGames();
    }
  };
  source.onopen = () => {
    void loadGames();
  };
})();
