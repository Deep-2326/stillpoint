import { Game } from "./core/Game.js";

function boot() {
  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing #game-canvas element");
  }

  const game = new Game(canvas);
  game.start();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
