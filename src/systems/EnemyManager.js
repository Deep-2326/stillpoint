import { CONFIG } from "../config.js";
import { Enemy } from "../entities/Enemy.js";
import { randomInt, randomRange } from "../utils.js";

export class EnemyManager {
  constructor(arenaWidth, arenaHeight) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;
    this.enemies = [];
  }

  reset() {
    this.enemies.length = 0;
  }

  spawnEnemy(type, wave) {
    const padding = CONFIG.ENEMIES.SPAWN_PADDING;
    const side = randomInt(0, 3);

    let x = 0;
    let y = 0;

    if (side === 0) {
      x = -padding;
      y = randomRange(padding, this.arenaHeight - padding);
    } else if (side === 1) {
      x = this.arenaWidth + padding;
      y = randomRange(padding, this.arenaHeight - padding);
    } else if (side === 2) {
      x = randomRange(padding, this.arenaWidth - padding);
      y = -padding;
    } else {
      x = randomRange(padding, this.arenaWidth - padding);
      y = this.arenaHeight + padding;
    }

    const enemy = new Enemy(type, x, y, wave);
    this.enemies.push(enemy);
    return enemy;
  }

  update(worldDt, player, emitEnemyBullet) {
    for (const enemy of this.enemies) {
      enemy.update(worldDt, player, emitEnemyBullet, this.arenaWidth, this.arenaHeight);
    }
  }

  render(ctx) {
    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }
  }

  collectDead() {
    const dead = [];
    const alive = [];

    for (const enemy of this.enemies) {
      if (enemy.dead) {
        dead.push(enemy);
      } else {
        alive.push(enemy);
      }
    }

    this.enemies = alive;
    return dead;
  }

  getAliveCount() {
    return this.enemies.length;
  }
}
