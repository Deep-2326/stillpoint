import { CONFIG, ENEMY_TYPES, GAME_STATES, PALETTE } from "../config.js";
import { drawNeonLine } from "../render/neon.js";
import { Bullet } from "../entities/Bullet.js";
import { Player } from "../entities/Player.js";
import { clamp, randomRange } from "../utils.js";
import { CollisionSystem } from "../systems/CollisionSystem.js";
import { EnemyManager } from "../systems/EnemyManager.js";
import { ParticleSystem } from "../systems/ParticleSystem.js";
import { UpgradeManager } from "../systems/UpgradeManager.js";
import { WaveManager } from "../systems/WaveManager.js";
import { UIManager } from "../ui/UIManager.js";
import { UpgradeScreen } from "../ui/UpgradeScreen.js";
import { Input } from "./Input.js";
import { StateManager } from "./StateManager.js";
import { TimeController } from "./TimeController.js";

const HIGH_SCORE_KEY = "stillpoint_high_score";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.width = CONFIG.CANVAS.WIDTH;
    this.height = CONFIG.CANVAS.HEIGHT;
    this.dpr = 1;

    this.state = new StateManager(GAME_STATES.MENU);
    this.input = new Input(canvas);
    this.timeController = new TimeController();

    this.waveManager = new WaveManager();
    this.enemyManager = new EnemyManager(this.width, this.height);
    this.collisionSystem = new CollisionSystem();
    this.upgradeManager = new UpgradeManager();
    this.particleSystem = new ParticleSystem();
    this.ui = new UIManager();
    this.upgradeScreen = new UpgradeScreen();

    this.player = null;
    this.playerBullets = [];
    this.enemyBullets = [];

    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.highScore = this.loadHighScore();
    this.permanentUpgrades = new Set();

    this.waveClearTimer = 0;
    this.damageFlashTimer = 0;

    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this.shakeX = 0;
    this.shakeY = 0;

    this.running = false;
    this.lastTime = 0;

    this.boundFrame = (timeStamp) => this.frame(timeStamp);
    this.boundResize = () => this.resizeCanvas();

    this.resizeCanvas();
    window.addEventListener("resize", this.boundResize);
  }

  resizeCanvas() {
    const dpr = clamp(window.devicePixelRatio || 1, 1, CONFIG.CANVAS.MAX_DPR);
    this.dpr = dpr;

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;

    this.input.setLogicalSize(this.width, this.height);
  }

  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this.boundFrame);
  }

  frame(timeStamp) {
    if (!this.running) return;

    if (this.lastTime === 0) {
      this.lastTime = timeStamp;
    }

    const dt = Math.min((timeStamp - this.lastTime) / 1000, CONFIG.TIMING.MAX_DT);
    this.lastTime = timeStamp;

    this.update(dt);
    this.render();

    this.input.endFrame();
    requestAnimationFrame(this.boundFrame);
  }

  update(dt) {
    if (this.state.is(GAME_STATES.MENU)) {
      this.updateMenu(dt);
    } else if (this.state.is(GAME_STATES.PLAYING)) {
      this.updatePlaying(dt);
    } else if (this.state.is(GAME_STATES.WAVE_CLEAR)) {
      this.updateWaveClear(dt);
    } else if (this.state.is(GAME_STATES.UPGRADE)) {
      this.updateUpgrade(dt);
    } else if (this.state.is(GAME_STATES.GAME_OVER)) {
      this.updateGameOver(dt);
    }

    this.updateShake(dt);
    this.damageFlashTimer = Math.max(0, this.damageFlashTimer - dt);
    this.ui.update(dt, this);
    this.updateCursor();
  }

  updateMenu(dt) {
    this.particleSystem.update(dt * 0.25);
    if (this.input.consumeStart()) {
      this.startRun();
    }
  }

  startRun() {
    this.player = new Player(this.width * 0.5, this.height * 0.5);
    this.playerBullets.length = 0;
    this.enemyBullets.length = 0;

    this.particleSystem.reset();
    this.enemyManager.reset();
    this.waveManager.reset();
    this.timeController = new TimeController();

    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.damageFlashTimer = 0;
    this.waveClearTimer = 0;
    this.permanentUpgrades.clear();

    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this.shakeX = 0;
    this.shakeY = 0;

    this.waveManager.startNextWave();
    this.state.set(GAME_STATES.PLAYING);
  }

  updatePlaying(dt) {
    this.player.update(
      dt,
      this.input,
      this.width,
      this.height,
      (bulletData) => this.spawnPlayerBullet(bulletData)
    );

    this.timeController.update(this.player.getSpeed(), dt);
    const worldDt = this.timeController.applyToDelta(dt);

    this.waveManager.update(worldDt, this.enemyManager);
    this.enemyManager.update(worldDt, this.player, (enemy, angle, speed) => {
      this.spawnEnemyBullet(enemy, angle, speed);
    });

    this.updateBullets(dt, worldDt);
    this.particleSystem.update(worldDt);

    const collisions = this.collisionSystem.resolve(
      this.player,
      this.enemyManager.enemies,
      this.playerBullets,
      this.enemyBullets
    );

    this.handleCollisionResult(collisions);

    const deadEnemies = this.enemyManager.collectDead();
    if (deadEnemies.length > 0) {
      for (const enemy of deadEnemies) {
        this.onEnemyKilled(enemy);
      }
    }

    if (this.combo > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    if (this.player.hp <= 0) {
      this.triggerGameOver();
      return;
    }

    if (this.waveManager.isWaveCleared(this.enemyManager)) {
      this.waveManager.markWaveInactive();
      this.waveClearTimer = CONFIG.TIMING.WAVE_CLEAR_DELAY;
      this.state.set(GAME_STATES.WAVE_CLEAR);
    }
  }

  updateWaveClear(dt) {
    this.particleSystem.update(dt * 0.5);
    this.waveClearTimer -= dt;

    if (this.waveClearTimer <= 0) {
      const choices = this.upgradeManager.getChoices(this.player, 3);
      this.upgradeScreen.open(choices, this.width, this.height);
      this.state.set(GAME_STATES.UPGRADE);
    }
  }

  updateUpgrade(dt) {
    this.particleSystem.update(dt * 0.35);
    const selection = this.upgradeScreen.update(this.input, dt, this.canvas);

    if (selection) {
      this.upgradeManager.applyUpgrade(selection.id, this.player, this);
      this.upgradeScreen.close();
      this.waveManager.startNextWave();
      this.state.set(GAME_STATES.PLAYING);
    }
  }

  updateGameOver(dt) {
    this.particleSystem.update(dt * 0.4);
    if (this.input.consumeRestart()) {
      this.startRun();
    }
  }

  updateCursor() {
    if (this.state.is(GAME_STATES.UPGRADE)) {
      this.canvas.style.cursor = this.upgradeScreen.isHovering() ? "pointer" : "default";
      return;
    }

    if (this.state.is(GAME_STATES.MENU) || this.state.is(GAME_STATES.GAME_OVER)) {
      this.canvas.style.cursor = "pointer";
      return;
    }

    this.canvas.style.cursor = "crosshair";
  }

  spawnPlayerBullet(bulletData) {
    this.playerBullets.push(new Bullet(bulletData));

    this.particleSystem.spawnBurst(bulletData.x, bulletData.y, {
      color: PALETTE.PLAYER,
      count: CONFIG.PARTICLES.PLAYER_SHOT_COUNT,
      speedMin: 30,
      speedMax: 120,
      life: 0.12,
      sizeMin: 0.8,
      sizeMax: 1.8,
      drag: 10,
      glow: 8,
      shapeMix: { spark: 0.7, debris: 0.3 }
    });
  }

  spawnEnemyBullet(enemy, angle, speed) {
    this.enemyBullets.push(new Bullet({
      x: enemy.x + Math.cos(angle) * (enemy.radius + 8),
      y: enemy.y + Math.sin(angle) * (enemy.radius + 8),
      angle,
      speed,
      radius: CONFIG.ENEMIES.BULLET.RADIUS,
      damage: CONFIG.ENEMIES.BULLET.DAMAGE,
      lifetime: CONFIG.ENEMIES.BULLET.LIFETIME,
      color: PALETTE.ENEMY,
      fromEnemy: true,
      pierceCount: 0
    }));

    this.particleSystem.spawnBurst(
      enemy.x + Math.cos(angle) * (enemy.radius + 6),
      enemy.y + Math.sin(angle) * (enemy.radius + 6),
      {
        color: PALETTE.ENEMY,
        count: CONFIG.PARTICLES.ENEMY_SHOT_COUNT,
        speedMin: 30,
        speedMax: 90,
        life: 0.14,
        sizeMin: 0.8,
        sizeMax: 1.8,
        drag: 10,
        glow: 8,
        shapeMix: { spark: 0.6, debris: 0.4 }
      }
    );
  }

  updateBullets(playerDt, worldDt) {
    for (const bullet of this.playerBullets) {
      bullet.update(playerDt);
      if (!bullet.dead) {
        this.particleSystem.spawnTrail(bullet.x, bullet.y, PALETTE.PLAYER, bullet.vx, bullet.vy);
      }
    }

    for (const bullet of this.enemyBullets) {
      bullet.update(worldDt);
      if (!bullet.dead) {
        this.particleSystem.spawnTrail(bullet.x, bullet.y, PALETTE.ENEMY, bullet.vx, bullet.vy);
      }
    }

    this.playerBullets = this.playerBullets.filter(
      (bullet) => !bullet.dead && !bullet.isOutOfBounds(this.width, this.height)
    );

    this.enemyBullets = this.enemyBullets.filter(
      (bullet) => !bullet.dead && !bullet.isOutOfBounds(this.width, this.height)
    );
  }

  handleCollisionResult(result) {
    if (result.enemyHit) {
      this.addShake(CONFIG.CAMERA.HIT_SHAKE);
      for (const point of result.hitPoints) {
        this.particleSystem.spawnImpact(point.x, point.y, point.color);
      }
    }

    if (result.playerHit) {
      this.addShake(CONFIG.CAMERA.DAMAGE_SHAKE);
      this.damageFlashTimer = CONFIG.TIMING.DAMAGE_FLASH_DURATION;

      if (CONFIG.SCORING.COMBO_DAMAGE_RESET) {
        this.combo = 1;
        this.comboTimer = 0;
      }
    }
  }

  onEnemyKilled(enemy) {
    this.particleSystem.spawnBurst(enemy.x, enemy.y, {
      color: PALETTE.ENEMY,
      count: enemy.type === ENEMY_TYPES.MINIBOSS
        ? CONFIG.PARTICLES.ENEMY_DEATH_COUNT * 3
        : CONFIG.PARTICLES.ENEMY_DEATH_COUNT,
      speedMin: 90,
      speedMax: enemy.type === ENEMY_TYPES.MINIBOSS ? 360 : 270,
      life: enemy.type === ENEMY_TYPES.MINIBOSS ? 0.8 : 0.5,
      sizeMin: 1.2,
      sizeMax: enemy.type === ENEMY_TYPES.MINIBOSS ? 5 : 3.2,
      glow: 12,
      shapeMix: { spark: 0.65, debris: 0.35 }
    });

    const gain = enemy.scoreValue * this.combo;
    this.score += gain;

    this.combo += CONFIG.SCORING.COMBO_STEP * this.player.comboAmplifier;
    this.combo = Math.min(this.combo, 12);
    this.comboTimer = CONFIG.SCORING.COMBO_TIMEOUT;

    this.addShake(enemy.type === ENEMY_TYPES.MINIBOSS ? CONFIG.CAMERA.DAMAGE_SHAKE : CONFIG.CAMERA.HIT_SHAKE + 0.8);
  }

  triggerGameOver() {
    this.state.set(GAME_STATES.GAME_OVER);
    this.upgradeScreen.close();

    if (this.score > this.highScore) {
      this.highScore = Math.round(this.score);
      this.saveHighScore(this.highScore);
    }
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(CONFIG.CAMERA.MAX_SHAKE, Math.max(this.shakeIntensity, amount));
    this.shakeTimer = CONFIG.CAMERA.SHAKE_DURATION;
  }

  updateShake(dt) {
    if (this.shakeTimer <= 0) {
      this.shakeIntensity = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      return;
    }

    this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    const ratio = this.shakeTimer / CONFIG.CAMERA.SHAKE_DURATION;
    const amplitude = this.shakeIntensity * ratio * ratio;

    this.shakeX = randomRange(-amplitude, amplitude);
    this.shakeY = randomRange(-amplitude, amplitude);
  }

  render() {
    const { ctx } = this;

    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    this.drawGrid();

    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    this.particleSystem.render(ctx);

    for (const bullet of this.playerBullets) {
      bullet.render(ctx);
    }

    for (const bullet of this.enemyBullets) {
      bullet.render(ctx);
    }

    this.enemyManager.render(ctx);
    if (this.player) {
      this.player.render(ctx);
    }

    ctx.restore();

    this.drawVignette();
    this.ui.render(ctx, this);

    if (this.state.is(GAME_STATES.UPGRADE)) {
      this.upgradeScreen.render(ctx, this.width, this.height);
    }
  }

  drawBackground() {
    const gradient = this.ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.5,
      Math.min(this.width, this.height) * 0.14,
      this.width * 0.5,
      this.height * 0.5,
      this.width * 0.72
    );

    gradient.addColorStop(0, PALETTE.BG_CENTER);
    gradient.addColorStop(1, PALETTE.BG_EDGE);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawGrid() {
    const size = CONFIG.WORLD.GRID_SIZE;
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;

    for (let x = 0; x <= this.width; x += size) {
      const edgeFade = 1 - Math.abs(x - centerX) / centerX;
      const alpha = CONFIG.WORLD.GRID_ALPHA * (0.28 + edgeFade * 0.72);
      drawNeonLine(this.ctx, {
        x1: x,
        y1: 0,
        x2: x,
        y2: this.height,
        color: `rgba(0, 234, 255, ${alpha.toFixed(4)})`,
        width: CONFIG.WORLD.GRID_LINE_WIDTH,
        glow: 2,
        alpha: 1
      });
    }

    for (let y = 0; y <= this.height; y += size) {
      const verticalFade = 1 - Math.abs(y - centerY) / centerY;
      const alpha = CONFIG.WORLD.GRID_ALPHA * (0.2 + verticalFade * 0.8);
      drawNeonLine(this.ctx, {
        x1: 0,
        y1: y,
        x2: this.width,
        y2: y,
        color: `rgba(0, 234, 255, ${alpha.toFixed(4)})`,
        width: CONFIG.WORLD.GRID_LINE_WIDTH,
        glow: 2,
        alpha: 1
      });
    }
  }

  drawVignette() {
    const vignette = this.ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.5,
      Math.min(this.width, this.height) * 0.34,
      this.width * 0.5,
      this.height * 0.5,
      Math.max(this.width, this.height) * 0.72
    );

    vignette.addColorStop(0, "rgba(10, 10, 18, 0)");
    vignette.addColorStop(1, `rgba(10, 10, 18, ${CONFIG.WORLD.VIGNETTE_OPACITY})`);

    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  loadHighScore() {
    try {
      const raw = localStorage.getItem(HIGH_SCORE_KEY);
      const value = Number(raw);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  saveHighScore(value) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(Math.round(value)));
    } catch {
      // Ignore persistence errors in restricted environments.
    }
  }
}
