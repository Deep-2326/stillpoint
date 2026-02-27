import { CONFIG } from "../config.js";

export class UpgradeScreen {
  constructor() {
    this.active = false;
    this.choices = [];
    this.cardRects = [];
    this.hoveredIndex = -1;
  }

  open(choices, canvasWidth, canvasHeight) {
    this.active = true;
    this.choices = choices;
    this.cardRects = this.computeCardLayout(canvasWidth, canvasHeight, choices.length);
    this.hoveredIndex = 0;
  }

  close() {
    this.active = false;
    this.choices = [];
    this.cardRects = [];
    this.hoveredIndex = -1;
  }

  update(input) {
    if (!this.active) return null;

    this.hoveredIndex = -1;
    for (let i = 0; i < this.cardRects.length; i += 1) {
      const rect = this.cardRects[i];
      if (
        input.mouse.x >= rect.x &&
        input.mouse.x <= rect.x + rect.w &&
        input.mouse.y >= rect.y &&
        input.mouse.y <= rect.y + rect.h
      ) {
        this.hoveredIndex = i;
        break;
      }
    }

    if (input.wasPressed("Digit1") && this.choices[0]) return this.choices[0];
    if (input.wasPressed("Digit2") && this.choices[1]) return this.choices[1];
    if (input.wasPressed("Digit3") && this.choices[2]) return this.choices[2];

    if (input.wasMousePressed(0) && this.hoveredIndex >= 0) {
      return this.choices[this.hoveredIndex];
    }

    if (input.wasPressed("Enter")) {
      return this.choices[Math.max(this.hoveredIndex, 0)] ?? null;
    }

    return null;
  }

  computeCardLayout(canvasWidth, canvasHeight, count) {
    const width = Math.min(340, (canvasWidth - 140) / count);
    const gap = 30;
    const totalWidth = count * width + (count - 1) * gap;
    const startX = (canvasWidth - totalWidth) * 0.5;
    const y = canvasHeight - 205;

    const rects = [];
    for (let i = 0; i < count; i += 1) {
      rects.push({
        x: startX + i * (width + gap),
        y,
        w: width,
        h: 138
      });
    }

    return rects;
  }

  render(ctx, canvasWidth, canvasHeight) {
    if (!this.active) return;

    ctx.save();
    ctx.fillStyle = "rgba(2, 6, 12, 0.72)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.textAlign = "center";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#66e5ff";
    ctx.fillStyle = "#9cebff";
    ctx.font = `700 58px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillText("CHOOSE UPGRADE", canvasWidth * 0.5, canvasHeight * 0.18);

    ctx.shadowBlur = 8;
    ctx.fillStyle = "#dffaff";
    ctx.font = `500 28px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillText("Pick one and continue the run", canvasWidth * 0.5, canvasHeight * 0.26);

    for (let i = 0; i < this.choices.length; i += 1) {
      const card = this.cardRects[i];
      const choice = this.choices[i];
      const hovered = i === this.hoveredIndex;

      ctx.save();
      ctx.translate(card.x, card.y);

      ctx.fillStyle = hovered ? "rgba(22, 34, 56, 0.95)" : "rgba(10, 18, 34, 0.9)";
      ctx.fillRect(0, 0, card.w, card.h);

      ctx.strokeStyle = choice.accent;
      ctx.lineWidth = hovered ? 3 : 2;
      ctx.shadowBlur = hovered ? 18 : 10;
      ctx.shadowColor = choice.accent;
      ctx.strokeRect(0, 0, card.w, card.h);

      ctx.fillStyle = choice.accent;
      ctx.font = `700 33px ${CONFIG.UI.FONT_FAMILY}`;
      ctx.textAlign = "left";
      ctx.fillText(choice.title, 18, 44);

      ctx.fillStyle = "#daf5ff";
      ctx.font = `500 22px ${CONFIG.UI.FONT_FAMILY}`;
      ctx.fillText(choice.description, 18, 86);

      ctx.fillStyle = "#9edaff";
      ctx.font = `600 19px ${CONFIG.UI.FONT_FAMILY}`;
      ctx.fillText(`[${i + 1}]`, card.w - 44, card.h - 16);

      ctx.restore();
    }

    ctx.restore();
  }
}
