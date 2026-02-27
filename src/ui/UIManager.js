import { CONFIG, GAME_STATES } from "../config.js";
import { lerp } from "../utils.js";

export class UIManager {
  constructor() {
    this.displayScore = 0;
    this.displayCombo = 1;
    this.comboPulse = 0;
    this.lastCombo = 1;
  }

  update(dt, game) {
    const scoreLerp = 1 - Math.exp(-CONFIG.UI.TRANSITION_SPEED * dt);
    this.displayScore = lerp(this.displayScore, game.score, scoreLerp);
    this.displayCombo = lerp(this.displayCombo, game.combo, scoreLerp);

    if (game.combo > this.lastCombo) {
      this.comboPulse = 1;
    }

    this.lastCombo = game.combo;
    this.comboPulse = Math.max(0, this.comboPulse - dt * 2.4);
  }

  render(ctx, game) {
    const state = game.state.get();

    if (state === GAME_STATES.PLAYING || state === GAME_STATES.WAVE_CLEAR || state === GAME_STATES.UPGRADE || state === GAME_STATES.GAME_OVER) {
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
    const wave = game.waveManager.currentWave;
    const comboText = `x${this.displayCombo.toFixed(1)} COMBO`;
    const scoreText = `SCORE: ${Math.round(this.displayScore)}`;
    const hpRatio = game.player.hp / game.player.maxHp;

    ctx.save();
    ctx.font = `700 40px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.textBaseline = "top";

    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(22, 179, 255, 0.95)";
    ctx.fillStyle = "#43d5ff";
    ctx.fillText(`WAVE ${wave}`, 34, 22);

    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(246, 90, 255, 0.95)";
    ctx.fillStyle = "#c677ff";
    ctx.fillText(comboText, game.canvas.width * 0.5, 24);

    ctx.textAlign = "right";
    ctx.shadowColor = "rgba(24, 211, 255, 0.95)";
    ctx.fillStyle = "#53e3ff";
    ctx.fillText(scoreText, game.canvas.width - 36, 22);

    ctx.restore();

    ctx.save();
    const barX = 28;
    const barY = game.canvas.height - 32;
    const barWidth = 260;
    const barHeight = 12;

    ctx.fillStyle = "rgba(15, 20, 32, 0.9)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = hpRatio > 0.35 ? "#24d8ff" : "#ff5d79";
    ctx.shadowBlur = 12;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    ctx.shadowBlur = 0;
    ctx.font = `600 24px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillStyle = "#d9f7ff";
    ctx.fillText(`HP ${Math.ceil(game.player.hp)}`, barX, barY - 26);

    ctx.textAlign = "right";
    ctx.font = `600 20px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillStyle = "#8ee9ff";
    ctx.fillText(`HI ${game.highScore}`, game.canvas.width - 26, game.canvas.height - 34);

    ctx.fillStyle = "#a7ebff";
    ctx.fillText(`TIME ${game.timeController.getScale().toFixed(2)}x`, game.canvas.width - 26, game.canvas.height - 58);
    ctx.restore();
  }

  renderWaveBanner(ctx, game) {
    const introRatio = game.waveManager.waveIntroTimer / CONFIG.TIMING.WAVE_INTRO_DURATION;
    if (introRatio <= 0) return;

    const alpha = Math.sin(introRatio * Math.PI) * 0.85;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.font = `700 56px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillStyle = "#d483ff";
    ctx.shadowBlur = 24;
    ctx.shadowColor = CONFIG.UI.WAVE_GLOW;
    ctx.fillText(`WAVE ${game.waveManager.currentWave}`, game.canvas.width * 0.5, game.canvas.height * 0.2);
    ctx.restore();
  }

  renderMenu(ctx, game) {
    ctx.save();
    ctx.textAlign = "center";

    const pulse = 0.6 + Math.sin(performance.now() * 0.005) * 0.2;

    ctx.shadowBlur = 22;
    ctx.shadowColor = CONFIG.UI.HUD_GLOW;
    ctx.fillStyle = "#7de9ff";
    ctx.font = `700 110px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillText("STILLPOINT", game.canvas.width * 0.5, game.canvas.height * 0.28);

    ctx.font = `500 30px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillStyle = "#e8f8ff";
    ctx.shadowBlur = 8;
    ctx.fillText("Time slows to 5% when you stop moving.", game.canvas.width * 0.5, game.canvas.height * 0.48);

    ctx.fillStyle = "#9ce8ff";
    ctx.font = `500 25px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillText("WASD move  •  Mouse aim + shoot  •  Space dash", game.canvas.width * 0.5, game.canvas.height * 0.56);

    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#ff66d2";
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#ff4bc6";
    ctx.font = `700 30px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillText("CLICK OR PRESS ENTER", game.canvas.width * 0.5, game.canvas.height * 0.68);

    ctx.restore();
  }

  renderWaveClear(ctx, game) {
    const ratio = game.waveClearTimer / CONFIG.TIMING.WAVE_CLEAR_DELAY;
    const alpha = 1 - ratio * 0.5;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.font = `700 64px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillStyle = "#54ebff";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#1de7ff";
    ctx.fillText("WAVE CLEARED", game.canvas.width * 0.5, game.canvas.height * 0.45);

    ctx.font = `600 28px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillStyle = "#ffa8ef";
    ctx.fillText("Choose an upgrade", game.canvas.width * 0.5, game.canvas.height * 0.54);
    ctx.restore();
  }

  renderGameOver(ctx, game) {
    ctx.save();
    ctx.fillStyle = "rgba(6, 9, 15, 0.72)";
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);

    ctx.textAlign = "center";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#ff4f7f";
    ctx.fillStyle = "#ff6085";
    ctx.font = `700 84px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillText("GAME OVER", game.canvas.width * 0.5, game.canvas.height * 0.35);

    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ffe1eb";
    ctx.font = `600 34px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillText(`Final Score: ${Math.round(game.score)}`, game.canvas.width * 0.5, game.canvas.height * 0.48);

    ctx.fillStyle = "#9be7ff";
    ctx.fillText(`High Score: ${game.highScore}`, game.canvas.width * 0.5, game.canvas.height * 0.56);

    ctx.fillStyle = "#ff78d7";
    ctx.font = `700 30px ${CONFIG.UI.FONT_FAMILY}`;
    ctx.fillText("Press R / Enter to restart", game.canvas.width * 0.5, game.canvas.height * 0.67);
    ctx.restore();
  }

  renderDamageFlash(ctx, game) {
    ctx.save();
    const alpha = game.damageFlashTimer / CONFIG.TIMING.DAMAGE_FLASH_DURATION;
    ctx.fillStyle = `rgba(255, 48, 76, ${alpha * 0.2})`;
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    ctx.restore();
  }
}
