import { CONFIG, ENEMY_TYPES } from "../config.js";
import { pickRandom } from "../utils.js";

export class WaveManager {
  constructor() {
    this.currentWave = 0;
    this.pendingSpawns = [];
    this.spawnTimer = 0;
    this.waveIntroTimer = 0;
    this.waveActive = false;
  }

  reset() {
    this.currentWave = 0;
    this.pendingSpawns = [];
    this.spawnTimer = 0;
    this.waveIntroTimer = 0;
    this.waveActive = false;
  }

  startNextWave() {
    this.currentWave += 1;
    this.pendingSpawns = this.buildWaveComposition(this.currentWave);
    this.spawnTimer = 0;
    this.waveIntroTimer = CONFIG.TIMING.WAVE_INTRO_DURATION;
    this.waveActive = true;
  }

  update(worldDt, enemyManager) {
    if (!this.waveActive) {
      return;
    }

    this.waveIntroTimer = Math.max(0, this.waveIntroTimer - worldDt);

    if (this.pendingSpawns.length === 0) {
      return;
    }

    this.spawnTimer -= worldDt;
    while (this.spawnTimer <= 0 && this.pendingSpawns.length > 0) {
      const type = this.pendingSpawns.shift();
      enemyManager.spawnEnemy(type, this.currentWave);
      this.spawnTimer += this.getSpawnInterval();
    }
  }

  getSpawnInterval() {
    return Math.max(0.14, CONFIG.WAVES.SPAWN_INTERVAL - this.currentWave * 0.015);
  }

  isSpawningComplete() {
    return this.pendingSpawns.length === 0;
  }

  isWaveCleared(enemyManager) {
    return this.waveActive && this.isSpawningComplete() && enemyManager.getAliveCount() === 0;
  }

  markWaveInactive() {
    this.waveActive = false;
  }

  buildWaveComposition(wave) {
    const total = Math.round(CONFIG.WAVES.BASE_ENEMY_COUNT + wave * CONFIG.WAVES.COUNT_GROWTH + wave * 0.5);
    const types = [ENEMY_TYPES.CHASER];

    if (wave >= CONFIG.WAVES.FAST_UNLOCK_WAVE) types.push(ENEMY_TYPES.FAST);
    if (wave >= CONFIG.WAVES.SHOOTER_UNLOCK_WAVE) types.push(ENEMY_TYPES.SHOOTER);
    if (wave >= CONFIG.WAVES.BURST_UNLOCK_WAVE) types.push(ENEMY_TYPES.BURST);

    const pool = [];
    for (let i = 0; i < total; i += 1) {
      pool.push(this.pickTypeForWave(types, wave));
    }

    if (wave % CONFIG.WAVES.MINIBOSS_EVERY === 0) {
      pool.push(ENEMY_TYPES.MINIBOSS);
    }

    return this.shuffle(pool);
  }

  pickTypeForWave(types, wave) {
    const weighted = [];

    for (const type of types) {
      let weight = 1;
      if (type === ENEMY_TYPES.CHASER) weight = Math.max(1, 4 - wave * 0.28);
      if (type === ENEMY_TYPES.FAST) weight = 1.1 + wave * 0.08;
      if (type === ENEMY_TYPES.SHOOTER) weight = 0.8 + wave * 0.12;
      if (type === ENEMY_TYPES.BURST) weight = 0.6 + wave * 0.1;

      const copies = Math.max(1, Math.round(weight * 3));
      for (let i = 0; i < copies; i += 1) {
        weighted.push(type);
      }
    }

    return pickRandom(weighted);
  }

  shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
