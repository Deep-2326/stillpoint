import { CONFIG, GAME_STATES } from "../config.js";
import { Bullet } from "../entities/Bullet.js";
import { Player } from "../entities/Player.js";
import { approach, randomRange } from "../utils.js";
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
    this.canvas.width = CONFIG.CANVAS.WIDTH;
    this.canvas.height = CONFIG.CANVAS.HEIGHT;

    this.state = new StateManager(GAME_STATES.MENU);
    this.input = new Input(canvas);
    this.timeController = new TimeController();

    this.waveManager = new WaveManager();
    this.enemyManager = new EnemyManager(this.canvas.width, this.canvas.height);
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
    this.shakeX = 0;
    this.shakeY = 0;

    this.running = false;
    this.lastTime = 0;

    this.boundFrame = (timeStamp) => this.frame(timeStamp);
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
    this.render(dt);

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
  }

  updateMenu(dt) {
    this.particleSystem.update(dt * 0.25);
    if (this.input.consumeStart()) {
      this.startRun();
    }
  }

  startRun() {
    this.player = new Player(this.canvas.width * 0.5, this.canvas.height * 0.5);
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
    this.shakeX = 0;
    this.shakeY = 0;

    this.waveManager.startNextWave();
    this.state.set(GAME_STATES.PLAYING);
  }

  updatePlaying(dt) {
    this.player.update(
      dt,
      this.input,
      this.canvas.width,
      this.canvas.height,
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
      this.upgradeScreen.open(choices, this.canvas.width, this.canvas.height);
      this.state.set(GAME_STATES.UPGRADE);
    }
  }

  updateUpgrade(dt) {
    this.particleSystem.update(dt * 0.35);
    const selection = this.upgradeScreen.update(this.input);

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

  spawnPlayerBullet(bulletData) {
    this.playerBullets.push(new Bullet(bulletData));
    this.particleSystem.spawnBurst(bulletData.x, bulletData.y, {
      color: "#2deaff",
      count: CONFIG.PARTICLES.PLAYER_SHOT_COUNT,
      speedMin: 20,
      speedMax: 100,
      life: 0.12,
      sizeMin: 0.8,
      sizeMax: 1.8,
      drag: 10,
      glow: 10
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
      color: "#ff4867",
      fromEnemy: true,
      pierceCount: 0
    }));

    this.particleSystem.spawnBurst(
      enemy.x + Math.cos(angle) * (enemy.radius + 6),
      enemy.y + Math.sin(angle) * (enemy.radius + 6),
      {
        color: "#ff4264",
        count: CONFIG.PARTICLES.ENEMY_SHOT_COUNT,
        speedMin: 20,
        speedMax: 90,
        life: 0.14,
        sizeMin: 0.8,
        sizeMax: 1.9,
        drag: 10,
        glow: 9
      }
    );
  }

  updateBullets(playerDt, worldDt) {
    for (const bullet of this.playerBullets) {
      bullet.update(playerDt);
      if (!bullet.dead) {
        this.particleSystem.spawnTrail(bullet.x, bullet.y, "#39e9ff", bullet.vx, bullet.vy);
      }
    }

    for (const bullet of this.enemyBullets) {
      bullet.update(worldDt);
      if (!bullet.dead) {
        this.particleSystem.spawnTrail(bullet.x, bullet.y, "#ff4f70", bullet.vx, bullet.vy);
      }
    }

    this.playerBullets = this.playerBullets.filter(
      (bullet) => !bullet.dead && !bullet.isOutOfBounds(this.canvas.width, this.canvas.height)
    );

    this.enemyBullets = this.enemyBullets.filter(
      (bullet) => !bullet.dead && !bullet.isOutOfBounds(this.canvas.width, this.canvas.height)
    );
  }

  handleCollisionResult(result) {
    if (result.enemyHit) {
      this.addShake(CONFIG.CAMERA.HIT_SHAKE);
      for (const point of result.hitPoints) {
        this.particleSystem.spawnBurst(point.x, point.y, {
          color: point.color,
          count: 4,
          speedMin: 40,
          speedMax: 150,
          life: CONFIG.PARTICLES.HIT_LIFETIME,
          sizeMin: 0.9,
          sizeMax: 2.2,
          glow: 10
        });
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
      color: "#ff365f",
      count: enemy.type === "miniboss" ? CONFIG.PARTICLES.ENEMY_DEATH_COUNT * 3 : CONFIG.PARTICLES.ENEMY_DEATH_COUNT,
      speedMin: 80,
      speedMax: enemy.type === "miniboss" ? 360 : 260,
      life: enemy.type === "miniboss" ? 0.85 : 0.52,
      sizeMin: 1.2,
      sizeMax: enemy.type === "miniboss" ? 5.2 : 3.4,
      glow: 14
    });

    const gain = enemy.scoreValue * this.combo;
    this.score += gain;

    this.combo += CONFIG.SCORING.COMBO_STEP * this.player.comboAmplifier;
    this.combo = Math.min(this.combo, 12);
    this.comboTimer = CONFIG.SCORING.COMBO_TIMEOUT;

    this.addShake(enemy.type === "miniboss" ? CONFIG.CAMERA.DAMAGE_SHAKE : CONFIG.CAMERA.HIT_SHAKE + 1);
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
    this.shakeIntensity = Math.max(this.shakeIntensity, amount);
  }

  updateShake(dt) {
    this.shakeIntensity = approach(this.shakeIntensity, 0, CONFIG.TIMING.SHAKE_DAMPING * dt);

    if (this.shakeIntensity <= 0.01) {
      this.shakeIntensity = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      return;
    }

    this.shakeX = randomRange(-this.shakeIntensity, this.shakeIntensity);
    this.shakeY = randomRange(-this.shakeIntensity, this.shakeIntensity);
  }

  render() {
    const { ctx } = this;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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

    this.ui.render(ctx, this);

    if (this.state.is(GAME_STATES.UPGRADE)) {
      this.upgradeScreen.render(ctx, this.canvas.width, this.canvas.height);
    }
  }

  drawBackground() {
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width * 0.5,
      this.canvas.height * 0.5,
      150,
      this.canvas.width * 0.5,
      this.canvas.height * 0.5,
      this.canvas.width * 0.68
    );

    gradient.addColorStop(0, "#121929");
    gradient.addColorStop(1, CONFIG.CANVAS.BACKGROUND);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid() {
    const size = CONFIG.WORLD.GRID_SIZE;

    this.ctx.save();
    this.ctx.strokeStyle = "rgba(80, 100, 150, 0.32)";
    this.ctx.lineWidth = CONFIG.WORLD.GRID_LINE_WIDTH;

    for (let x = 0; x <= this.canvas.width; x += size) {
      this.ctx.globalAlpha = (x / size) % 2 === 0 ? CONFIG.WORLD.GRID_ALPHA : CONFIG.WORLD.GRID_ALPHA * 0.46;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.canvas.height; y += size) {
      this.ctx.globalAlpha = (y / size) % 2 === 0 ? CONFIG.WORLD.GRID_ALPHA : CONFIG.WORLD.GRID_ALPHA * 0.46;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
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
