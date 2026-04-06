"use strict";
(() => {
  // src/client/index.ts
  var button = document.getElementById("fetch-btn");
  var list = document.getElementById("user-list");
  var template = document.getElementById(
    "user-template"
  );
  async function loadPlayers() {
    const response = await fetch("/auth/users");
    const data = await response.json();
    if (list) list.innerHTML = "";
    data.forEach((user) => {
      const clone = template.content.cloneNode(true);
      const span = clone.querySelector(".user-email");
      if (span) span.textContent = user.email;
      list?.appendChild(clone);
    });
  }
  button?.addEventListener("click", () => {
    void loadPlayers();
  });
  document.addEventListener("DOMContentLoaded", () => {
    void loadPlayers();
  });
})();
