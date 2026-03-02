export class LoadingScreen {
  private container: HTMLElement;
  private wipe: HTMLElement;
  private landing: HTMLElement;
  private readonly welcomeText = "WELCOME TO";
  private readonly titleText = "EXPLODING KITTENS";
  private readonly baseDelay = 150;

  constructor() {
    this.preloadSprites();
    const container = document.getElementById("loading-screen");
    const wipe = document.getElementById("wipe");
    const landing = document.getElementById("landing-screen");

    if (!container || !wipe || !landing) {
      throw new Error("LoadingScreen: required DOM elements not found");
    }

    this.container = container;
    this.wipe = wipe;
    this.landing = landing;
  }

  public play(): void {
    const welcomeFinishDelay = this.welcomeText.length * this.baseDelay + 400;
    this.renderLetters(welcomeFinishDelay);
    setTimeout(() => {
      this.renderCat();
    }, welcomeFinishDelay);

    const catDelay = welcomeFinishDelay + this.titleText.length * this.baseDelay + 5000;
    setTimeout(() => {
      this.loadPlayButton();
    }, catDelay);
    // setTimeout(() => { this.triggerWipe(); }, wipeDelay + 1600);
  }

  private renderLetters(delay: number): void {
    const welcomeRow = document.createElement("div");
    welcomeRow.classList.add("welcome-row");
    const titleRow = document.createElement("div");
    this.container.appendChild(welcomeRow);
    this.container.appendChild(titleRow);
    this.welcomeText.split("").forEach((char, i) => {
      const span = document.createElement("span");
      span.classList.add("welcome-text");
      span.style.animationDelay = `${String(i * this.baseDelay)}ms`;
      span.textContent = char === " " ? "\u00A0" : char;
      if (char !== " ") span.style.marginRight = "1px";
      welcomeRow.appendChild(span);
    });
    this.titleText.split("").forEach((char, i) => {
      const span = document.createElement("span");
      span.classList.add("title-text");
      span.style.animationDelay = `${String(delay + i * this.baseDelay)}ms`;
      span.textContent = char === " " ? "\u00A0" : char;
      if (char !== " ") span.style.marginRight = "1px";
      titleRow.appendChild(span);
    });
  }

  private preloadSprites(): void {
    const sprites = [
      "../images-gif/intro/cat_roll.png",
      "../images-gif/intro/cat_pull.png",
      "../images-gif/intro/cat_run.png",
      "../images-gif/intro/cat_fade.png",
      "../images-gif/intro/cat_idle.png",
    ];
    sprites.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  private renderCat(): void {
    const cat = document.createElement("div");
    cat.id = "cat";
    this.container.appendChild(cat);

    this.setCatState(cat, "run");
    setTimeout(() => {
      this.setCatState(cat, "roll");
    }, 4000);
    setTimeout(() => {
      this.setCatState(cat, "pull");
    }, 8000);
  }

  private setCatState(cat: HTMLElement, state: "roll" | "idle" | "pull" | "run"): void {
    cat.style.transform = window.getComputedStyle(cat).transform;
    cat.classList.remove("roll", "idle", "pull", "run");
    cat.classList.add(state);
  }

  private loadPlayButton(): void {
    const play = document.createElement("button");
    play.classList.add("buttons");
    play.textContent = "PLAY";

    this.container.appendChild(play);
    play.addEventListener("click", () => {
      this.triggerWipe();
    });
  }

  private triggerWipe(): void {
    this.wipe.classList.add("expanding");

    this.wipe.addEventListener(
      "animationend",
      () => {
        this.container.classList.add("hidden");
        this.landing.classList.remove("hidden");
      },
      { once: true },
    );
  }
}
