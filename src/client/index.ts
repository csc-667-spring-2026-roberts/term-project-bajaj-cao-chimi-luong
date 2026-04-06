const button = document.getElementById("fetch-btn");
const list = document.getElementById("user-list");
const template = document.getElementById("user-template") as HTMLTemplateElement;

interface User {
  email: string;
}

async function loadPlayers(): Promise<void> {
  const response = await fetch("/auth/users");
  const data = (await response.json()) as User[];

  if (list) list.innerHTML = "";

  data.forEach((user: User) => {
    const clone = template.content.cloneNode(true) as DocumentFragment;
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
