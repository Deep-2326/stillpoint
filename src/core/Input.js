import { normalize } from "../utils.js";

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.mouseButtonsDown = new Set();
    this.mouseButtonsPressed = new Set();
    this.mouse = { x: 0, y: 0 };

    this.logicalWidth = canvas.clientWidth || canvas.width || 1;
    this.logicalHeight = canvas.clientHeight || canvas.height || 1;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onBlur = this.onBlur.bind(this);

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    canvas.addEventListener("mousemove", this.onMouseMove);
    canvas.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  setLogicalSize(width, height) {
    this.logicalWidth = Math.max(1, width);
    this.logicalHeight = Math.max(1, height);
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  onBlur() {
    this.keysDown.clear();
    this.keysPressed.clear();
    this.mouseButtonsDown.clear();
    this.mouseButtonsPressed.clear();
  }

  onKeyDown(event) {
    if (!this.keysDown.has(event.code)) {
      this.keysPressed.add(event.code);
    }
    this.keysDown.add(event.code);

    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      event.preventDefault();
    }
  }

  onKeyUp(event) {
    this.keysDown.delete(event.code);
  }

  onMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.logicalWidth / rect.width;
    const sy = this.logicalHeight / rect.height;
    this.mouse.x = (event.clientX - rect.left) * sx;
    this.mouse.y = (event.clientY - rect.top) * sy;
  }

  onMouseDown(event) {
    if (!this.mouseButtonsDown.has(event.button)) {
      this.mouseButtonsPressed.add(event.button);
    }
    this.mouseButtonsDown.add(event.button);
  }

  onMouseUp(event) {
    this.mouseButtonsDown.delete(event.button);
  }

  isDown(code) {
    return this.keysDown.has(code);
  }

  wasPressed(code) {
    return this.keysPressed.has(code);
  }

  wasMousePressed(button = 0) {
    return this.mouseButtonsPressed.has(button);
  }

  isMouseDown(button = 0) {
    return this.mouseButtonsDown.has(button);
  }

  getMoveVector() {
    const x = (this.isDown("KeyD") || this.isDown("ArrowRight") ? 1 : 0)
      - (this.isDown("KeyA") || this.isDown("ArrowLeft") ? 1 : 0);
    const y = (this.isDown("KeyS") || this.isDown("ArrowDown") ? 1 : 0)
      - (this.isDown("KeyW") || this.isDown("ArrowUp") ? 1 : 0);
    return normalize(x, y);
  }

  consumeDash() {
    const pressed = this.wasPressed("Space") || this.wasPressed("ShiftLeft") || this.wasPressed("ShiftRight");
    if (pressed) {
      this.keysPressed.delete("Space");
      this.keysPressed.delete("ShiftLeft");
      this.keysPressed.delete("ShiftRight");
    }
    return pressed;
  }

  consumeStart() {
    const pressed = this.wasPressed("Enter") || this.wasMousePressed(0);
    if (pressed) {
      this.keysPressed.delete("Enter");
      this.mouseButtonsPressed.delete(0);
    }
    return pressed;
  }

  consumeRestart() {
    const pressed = this.wasPressed("KeyR") || this.wasPressed("Enter");
    if (pressed) {
      this.keysPressed.delete("KeyR");
      this.keysPressed.delete("Enter");
    }
    return pressed;
  }

  endFrame() {
    this.keysPressed.clear();
    this.mouseButtonsPressed.clear();
  }
}
