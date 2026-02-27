import { CONFIG, PALETTE } from "../config.js";
import { drawNeonText, drawRoundedRectPath } from "../render/neon.js";
import { lerp } from "../utils.js";

function drawIcon(ctx, icon, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (icon === "split") {
    ctx.beginPath();
    ctx.moveTo(-18, 6);
    ctx.lineTo(-2, -8);
    ctx.lineTo(14, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-16, -7);
    ctx.lineTo(16, -7);
    ctx.stroke();
  } else if (icon === "pierce") {
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -8);
    ctx.lineTo(16, 0);
    ctx.lineTo(8, 8);
    ctx.stroke();
  } else if (icon === "dash") {
    ctx.beginPath();
    ctx.moveTo(-16, 10);
    ctx.lineTo(6, 0);
    ctx.lineTo(-16, -10);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, 10);
    ctx.lineTo(20, 0);
    ctx.lineTo(2, -10);
    ctx.closePath();
    ctx.stroke();
  } else if (icon === "time") {
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -7);
    ctx.lineTo(6, -2);
    ctx.stroke();
  } else if (icon === "speed") {
    ctx.beginPath();
    ctx.moveTo(-18, -6);
    ctx.lineTo(-2, -6);
    ctx.lineTo(8, -14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-18, 6);
    ctx.lineTo(6, 6);
    ctx.lineTo(16, -2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(12, 12);
    ctx.moveTo(12, -12);
    ctx.lineTo(-12, 12);
    ctx.stroke();
  }

  ctx.restore();
}

export class UpgradeScreen {
  constructor() {
    this.active = false;
    this.choices = [];
    this.cardRects = [];
    this.cardHover = [];
    this.hoveredIndex = -1;
  }

  isHovering() {
    return this.hoveredIndex >= 0;
  }

  open(choices, canvasWidth, canvasHeight) {
    this.active = true;
    this.choices = choices;
    this.cardRects = this.computeCardLayout(canvasWidth, canvasHeight, choices.length);
    this.cardHover = new Array(choices.length).fill(0);
    this.hoveredIndex = 0;
  }

  close() {
    this.active = false;
    this.choices = [];
    this.cardRects = [];
    this.cardHover = [];
    this.hoveredIndex = -1;
  }

  update(input, dt, canvas) {
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

    for (let i = 0; i < this.cardHover.length; i += 1) {
      const target = i === this.hoveredIndex ? 1 : 0;
      this.cardHover[i] = lerp(this.cardHover[i], target, 1 - Math.exp(-dt * 10));
    }

    if (canvas) {
      canvas.style.cursor = this.hoveredIndex >= 0 ? "pointer" : "default";
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
    const width = Math.min(338, (canvasWidth - 180) / count);
    const gap = 36;
    const totalWidth = count * width + (count - 1) * gap;
    const startX = (canvasWidth - totalWidth) * 0.5;
    const y = canvasHeight * 0.56;

    const rects = [];
    for (let i = 0; i < count; i += 1) {
      rects.push({
        x: startX + i * (width + gap),
        y,
        w: width,
        h: 182
      });
    }

    return rects;
  }

  render(ctx, canvasWidth, canvasHeight) {
    if (!this.active) return;

    ctx.save();
    ctx.fillStyle = "rgba(6, 10, 14, 0.76)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    drawNeonText(ctx, {
      text: "Choose Upgrade",
      x: canvasWidth * 0.5,
      y: canvasHeight * 0.16,
      color: PALETTE.PLAYER,
      font: `700 58px ${CONFIG.UI.FONT_FAMILY}`,
      align: "center",
      baseline: "top",
      glow: 18,
      letterSpacing: 2.2,
      alpha: 1,
      uppercase: true
    });

    drawNeonText(ctx, {
      text: "Pick one to continue",
      x: canvasWidth * 0.5,
      y: canvasHeight * 0.25,
      color: PALETTE.WHITE,
      font: `600 24px ${CONFIG.UI.FONT_FAMILY}`,
      align: "center",
      baseline: "top",
      glow: 4,
      letterSpacing: 1.4,
      alpha: 0.9,
      uppercase: true
    });

    for (let i = 0; i < this.choices.length; i += 1) {
      const card = this.cardRects[i];
      const choice = this.choices[i];
      const hover = this.cardHover[i] ?? 0;

      const scale = 1 + hover * 0.05;
      const shiftY = hover * -8;
      const cx = card.x + card.w * 0.5;
      const cy = card.y + card.h * 0.5 + shiftY;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-card.w * 0.5, -card.h * 0.5);

      drawRoundedRectPath(ctx, 0, 0, card.w, card.h, 14);
      ctx.fillStyle = "#151520";
      ctx.fill();

      ctx.lineWidth = 2 + hover * 1.4;
      ctx.strokeStyle = choice.accent;
      ctx.shadowBlur = 9 + hover * 10;
      ctx.shadowColor = choice.accent;
      drawRoundedRectPath(ctx, 0, 0, card.w, card.h, 14);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.translate(card.w * 0.5, 46);
      ctx.shadowBlur = 12;
      ctx.shadowColor = choice.accent;
      drawIcon(ctx, choice.icon, choice.accent);
      ctx.restore();

      drawNeonText(ctx, {
        text: choice.title,
        x: card.w * 0.5,
        y: 78,
        color: choice.accent,
        font: `700 30px ${CONFIG.UI.FONT_FAMILY}`,
        align: "center",
        baseline: "top",
        glow: 10,
        letterSpacing: 1.6,
        alpha: 1,
        uppercase: true
      });

      drawNeonText(ctx, {
        text: choice.description,
        x: card.w * 0.5,
        y: 122,
        color: PALETTE.WHITE,
        font: `600 16px ${CONFIG.UI.FONT_FAMILY}`,
        align: "center",
        baseline: "top",
        glow: 2,
        letterSpacing: 0.8,
        alpha: 0.92,
        uppercase: true
      });

      drawNeonText(ctx, {
        text: `[${i + 1}]`,
        x: card.w - 24,
        y: card.h - 26,
        color: PALETTE.PURPLE,
        font: `700 16px ${CONFIG.UI.FONT_FAMILY}`,
        align: "right",
        baseline: "top",
        glow: 8,
        letterSpacing: 1,
        alpha: 0.95,
        uppercase: false
      });

      ctx.restore();
    }
  }
}
