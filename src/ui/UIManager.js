import { CONFIG, GAME_STATES, PALETTE } from "../config.js";
import { drawNeonLine, drawNeonText, drawRoundedRectPath } from "../render/neon.js";
import { lerp } from "../utils.js";

export class UIManager {
  constructor() {
    this.displayScore = 0;
    this.displayCombo = 1;
    this.displayHp = 1;
    this.comboPulse = 0;
    this.lastCombo = 1;
  }

  update(dt, game) {
    const scoreLerp = 1 - Math.exp(-CONFIG.UI.TRANSITION_SPEED * dt);
    this.displayScore = lerp(this.displayScore, game.score, scoreLerp);
    this.displayCombo = lerp(this.displayCombo, game.combo, scoreLerp);

    if (game.player) {
      const hpRatio = game.player.hp / game.player.maxHp;
      this.displayHp = lerp(this.displayHp, hpRatio, 1 - Math.exp(-12 * dt));
    }

    if (game.combo > this.lastCombo) {
      this.comboPulse = 1;
    }

    this.lastCombo = game.combo;
    this.comboPulse = Math.max(0, this.comboPulse - dt * 2.8);
  }

  drawHudText(ctx, text, x, y, color, align = "left", size = 22, weight = 600, glow = CONFIG.VISUAL.HUD_TEXT_GLOW) {
    drawNeonText(ctx, {
      text,
      x,
      y,
      color,
      font: `${weight} ${size}px ${CONFIG.UI.FONT_FAMILY}`,
      align,
      baseline: "top",
      glow,
      letterSpacing: CONFIG.UI.LETTER_SPACING,
      uppercase: true
    });
  }

  render(ctx, game) {
    const state = game.state.get();

    if (
      state === GAME_STATES.PLAYING ||
      state === GAME_STATES.WAVE_CLEAR ||
      state === GAME_STATES.UPGRADE ||
      state === GAME_STATES.GAME_OVER
    ) {
      this.renderHud(ctx, game);
      this.renderWaveBanner(ctx, game);
    }

    if (state === GAME_STATES.MENU) {
      this.renderMenu(ctx, game);
    }

    if (state === GAME_STATES.WAVE_CLEAR) {
      this.renderWaveClear(ctx, game);
    }

    if (state === GAME_STATES.GAME_OVER) {
      this.renderGameOver(ctx, game);
    }

    if (game.damageFlashTimer > 0) {
      this.renderDamageFlash(ctx, game);
    }
  }

  renderHud(ctx, game) {
    if (!game.player) return;

    const wave = game.waveManager.currentWave;
    const comboScale = 1 + this.comboPulse * 0.12;
    const comboText = `x${this.displayCombo.toFixed(1)} COMBO`;
    const scoreText = `SCORE ${String(Math.round(this.displayScore)).padStart(5, "0")}`;

    const topY = 20;
    const leftX = 38;
    const rightX = game.width - 38;
    const centerX = game.width * 0.5;

    this.drawHudText(ctx, `WAVE ${wave}`, leftX, topY, PALETTE.PLAYER, "left", 33, 700, 14);

    ctx.save();
    ctx.translate(centerX, topY);
    ctx.scale(comboScale, comboScale);
    this.drawHudText(ctx, comboText, 0, 0, PALETTE.PURPLE, "center", 33, 700, 16);
    ctx.restore();

    drawNeonLine(ctx, {
      x1: centerX - 210,
      y1: topY + 22,
      x2: centerX - 122,
      y2: topY + 22,
      color: PALETTE.PLAYER,
      width: 3,
      glow: 8,
      alpha: 0.78
    });

    drawNeonLine(ctx, {
      x1: centerX + 122,
      y1: topY + 22,
      x2: centerX + 210,
      y2: topY + 22,
      color: PALETTE.ENEMY,
      width: 3,
      glow: 8,
      alpha: 0.78
    });

    this.drawHudText(ctx, scoreText, rightX, topY, PALETTE.PLAYER, "right", 33, 700, 14);

    const barX = 30;
    const barY = game.height - 36;
    const barWidth = 284;
    const barHeight = 14;
    const hpRatio = Math.max(0, Math.min(1, this.displayHp));

    ctx.save();
    drawRoundedRectPath(ctx, barX, barY, barWidth, barHeight, 7);
    ctx.fillStyle = "rgba(10, 16, 22, 0.92)";
    ctx.fill();

    drawRoundedRectPath(ctx, barX, barY, barWidth * hpRatio, barHeight, 7);
    ctx.fillStyle = PALETTE.HP;
    ctx.shadowBlur = 10;
    ctx.shadowColor = PALETTE.HP;
    ctx.fill();
    ctx.shadowBlur = 0;

    this.drawHudText(ctx, `HP ${Math.ceil(game.player.hp)}`, barX, barY - 26, PALETTE.WHITE, "left", 18, 700, 8);
    ctx.restore();

    this.drawHudText(
      ctx,
      `TIME ${game.timeController.getScale().toFixed(2)}X`,
      game.width - 28,
      game.height - 58,
      "rgba(244, 251, 255, 0.85)",
      "right",
      15,
      600,
      2
    );

    this.drawHudText(
      ctx,
      `HI ${game.highScore}`,
      game.width - 28,
      game.height - 34,
      "rgba(0, 245, 255, 0.65)",
      "right",
      16,
      600,
      4
    );
  }

  renderWaveBanner(ctx, game) {
    const introRatio = game.waveManager.waveIntroTimer / CONFIG.TIMING.WAVE_INTRO_DURATION;
    if (introRatio <= 0) return;

    const t = 1 - introRatio;
    const alpha = Math.sin(t * Math.PI) * 0.88;
    const scale = 0.94 + Math.sin(t * Math.PI) * 0.08;

    ctx.save();
    ctx.translate(game.width * 0.5, game.height * 0.19);
    ctx.scale(scale, scale);
    drawNeonText(ctx, {
      text: `WAVE ${game.waveManager.currentWave}`,
      x: 0,
      y: 0,
      color: PALETTE.PURPLE,
      font: `700 56px ${CONFIG.UI.FONT_FAMILY}`,
      align: "center",
      baseline: "top",
      glow: 18,
      letterSpacing: 2.2,
      alpha,
      uppercase: true
    });
    ctx.restore();
  }

  renderMenu(ctx, game) {
    const pulse = 0.55 + Math.sin(performance.now() * 0.006) * 0.25;

    drawNeonText(ctx, {
      text: "STILLPOINT",
      x: game.width * 0.5,
      y: game.height * 0.24,
      color: PALETTE.PLAYER,
      font: `700 108px ${CONFIG.UI.FONT_FAMILY}`,
      align: "center",
      baseline: "top",
      glow: 24,
      letterSpacing: 5,
      alpha: 1,
      uppercase: true
    });

    this.drawHudText(
      ctx,
      "TIME SLOWS TO 5% WHEN YOU STOP MOVING",
      game.width * 0.5,
      game.height * 0.45,
      PALETTE.WHITE,
      "center",
      28,
      600,
      5
    );

    this.drawHudText(
      ctx,
      "WASD MOVE   MOUSE AIM + SHOOT   SPACE DASH",
      game.width * 0.5,
      game.height * 0.52,
      PALETTE.PLAYER,
      "center",
      22,
      600,
      5
    );

    this.drawHudText(
      ctx,
      "CLICK OR PRESS ENTER",
      game.width * 0.5,
      game.height * 0.64,
      PALETTE.PURPLE,
      "center",
      30,
      700,
      12
    );

    ctx.save();
    ctx.globalAlpha = pulse;
    drawNeonLine(ctx, {
      x1: game.width * 0.35,
      y1: game.height * 0.69,
      x2: game.width * 0.65,
      y2: game.height * 0.69,
      color: PALETTE.PURPLE,
      width: 2,
      glow: 8,
      alpha: 0.8
    });
    ctx.restore();
  }

  renderWaveClear(ctx, game) {
    const ratio = game.waveClearTimer / CONFIG.TIMING.WAVE_CLEAR_DELAY;
    const alpha = 1 - ratio * 0.6;

    drawNeonText(ctx, {
      text: "WAVE CLEARED",
      x: game.width * 0.5,
      y: game.height * 0.43,
      color: PALETTE.PLAYER,
      font: `700 62px ${CONFIG.UI.FONT_FAMILY}`,
      align: "center",
      baseline: "top",
      glow: 16,
      alpha,
      letterSpacing: 2.2,
      uppercase: true
    });

    drawNeonText(ctx, {
      text: "SELECT AN UPGRADE",
      x: game.width * 0.5,
      y: game.height * 0.52,
      color: PALETTE.PURPLE,
      font: `700 28px ${CONFIG.UI.FONT_FAMILY}`,
      align: "center",
      baseline: "top",
      glow: 10,
      alpha,
      letterSpacing: 1.8,
      uppercase: true
    });
  }

  renderGameOver(ctx, game) {
    ctx.save();
    ctx.fillStyle = "rgba(4, 8, 12, 0.78)";
    ctx.fillRect(0, 0, game.width, game.height);
    ctx.restore();

    this.drawHudText(ctx, "GAME OVER", game.width * 0.5, game.height * 0.33, PALETTE.ENEMY, "center", 82, 700, 18);
    this.drawHudText(ctx, `FINAL SCORE ${Math.round(game.score)}`, game.width * 0.5, game.height * 0.48, PALETTE.WHITE, "center", 32, 600, 8);
    this.drawHudText(ctx, `HIGH SCORE ${game.highScore}`, game.width * 0.5, game.height * 0.56, "rgba(0, 245, 255, 0.8)", "center", 28, 600, 8);
    this.drawHudText(ctx, "PRESS R OR ENTER TO RESTART", game.width * 0.5, game.height * 0.66, PALETTE.PURPLE, "center", 28, 700, 12);
  }

  renderDamageFlash(ctx, game) {
    ctx.save();
    const alpha = game.damageFlashTimer / CONFIG.TIMING.DAMAGE_FLASH_DURATION;
    ctx.fillStyle = `rgba(255, 42, 77, ${alpha * 0.18})`;
    ctx.fillRect(0, 0, game.width, game.height);
    ctx.restore();
  }
}
