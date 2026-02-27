import { CONFIG, ENEMY_TYPES, PALETTE } from "../config.js";
import { angleTo, clamp, normalize, randomRange, vectorFromAngle } from "../utils.js";

let NEXT_ENEMY_ID = 1;

function drawPolygon(ctx, sides, radius) {
  const step = (Math.PI * 2) / sides;
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = -Math.PI / 2 + step * i;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function drawShape(ctx, type, radius) {
  if (type === ENEMY_TYPES.CHASER) {
    drawPolygon(ctx, 3, radius);
    return;
  }

  if (type === ENEMY_TYPES.SHOOTER) {
    drawPolygon(ctx, 4, radius);
    return;
  }

  if (type === ENEMY_TYPES.BURST) {
    drawPolygon(ctx, 6, radius);
    return;
  }

  if (type === ENEMY_TYPES.MINIBOSS) {
    drawPolygon(ctx, 8, radius);
    return;
  }

  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.lineTo(radius * 0.72, 0);
  ctx.lineTo(0, radius);
  ctx.lineTo(-radius * 0.72, 0);
  ctx.closePath();
}

export class Enemy {
  constructor(type, x, y, wave = 1) {
    const base = CONFIG.ENEMIES[type];

    this.id = NEXT_ENEMY_ID;
    NEXT_ENEMY_ID += 1;

    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.radius = base.RADIUS;
    this.maxHp = base.HP * (1 + Math.max(0, wave - 1) * 0.06);
    this.hp = this.maxHp;
    this.speed = base.SPEED * (1 + Math.max(0, wave - 1) * 0.016);
    this.contactDamage = base.CONTACT_DAMAGE;
    this.scoreValue = Math.round(base.SCORE * (1 + Math.max(0, wave - 1) * 0.04));

    this.shootInterval = base.SHOOT_INTERVAL;
    this.projectileSpeed = base.PROJECTILE_SPEED;
    this.desiredRange = base.DESIRED_RANGE ?? 0;

    this.shootTimer = this.shootInterval > 0 ? randomRange(0.25, this.shootInterval) : 0;
    this.burstShotsLeft = 0;
    this.burstDelayTimer = 0;

    this.flash = 0;
    this.dead = false;
    this.orbitDirection = Math.random() < 0.5 ? -1 : 1;
    this.behaviorTime = randomRange(0, Math.PI * 2);
  }

  update(worldDt, player, emitEnemyBullet, arenaWidth, arenaHeight) {
    if (this.dead) return;

    this.behaviorTime += worldDt;
    this.flash = Math.max(0, this.flash - worldDt * 8);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    let moveX = 0;
    let moveY = 0;

    switch (this.type) {
      case ENEMY_TYPES.CHASER: {
        moveX = dirX;
        moveY = dirY;
        break;
      }
      case ENEMY_TYPES.FAST: {
        const wobble = Math.sin(this.behaviorTime * 9) * 0.4;
        moveX = dirX - dirY * wobble;
        moveY = dirY + dirX * wobble;
        break;
      }
      case ENEMY_TYPES.SHOOTER: {
        if (dist > this.desiredRange + 40) {
          moveX = dirX;
          moveY = dirY;
        } else if (dist < this.desiredRange - 40) {
          moveX = -dirX;
          moveY = -dirY;
        } else {
          moveX = -dirY * this.orbitDirection;
          moveY = dirX * this.orbitDirection;
        }

        this.shootTimer -= worldDt;
        if (this.shootTimer <= 0) {
          this.shootTimer = this.shootInterval;
          const shotAngle = angleTo(this.x, this.y, player.x, player.y);
          emitEnemyBullet(this, shotAngle, this.projectileSpeed);
        }
        break;
      }
      case ENEMY_TYPES.BURST: {
        if (dist > this.desiredRange + 55) {
          moveX = dirX;
          moveY = dirY;
        } else if (dist < this.desiredRange - 70) {
          moveX = -dirX;
          moveY = -dirY;
        }

        if (this.burstShotsLeft > 0) {
          this.burstDelayTimer -= worldDt;
          if (this.burstDelayTimer <= 0) {
            this.burstDelayTimer = CONFIG.ENEMIES[ENEMY_TYPES.BURST].BURST_DELAY;
            this.burstShotsLeft -= 1;
            const spread = randomRange(-0.14, 0.14);
            const shotAngle = angleTo(this.x, this.y, player.x, player.y) + spread;
            emitEnemyBullet(this, shotAngle, this.projectileSpeed);
          }
        } else {
          this.shootTimer -= worldDt;
          if (this.shootTimer <= 0) {
            this.shootTimer = this.shootInterval;
            this.burstShotsLeft = CONFIG.ENEMIES[ENEMY_TYPES.BURST].BURST_COUNT;
            this.burstDelayTimer = 0;
          }
        }
        break;
      }
      case ENEMY_TYPES.MINIBOSS: {
        if (dist > 320) {
          moveX = dirX;
          moveY = dirY;
        } else {
          moveX = -dirY * this.orbitDirection;
          moveY = dirX * this.orbitDirection;
        }

        this.shootTimer -= worldDt;
        if (this.shootTimer <= 0) {
          this.shootTimer = this.shootInterval;
          const burstCount = CONFIG.ENEMIES[ENEMY_TYPES.MINIBOSS].BURST_COUNT;
          const baseAngle = angleTo(this.x, this.y, player.x, player.y);
          for (let i = 0; i < burstCount; i += 1) {
            const angle = baseAngle + (Math.PI * 2 * i) / burstCount;
            emitEnemyBullet(this, angle, this.projectileSpeed);
          }
        }
        break;
      }
      default:
        break;
    }

    const movement = normalize(moveX, moveY);
    this.vx = movement.x * this.speed;
    this.vy = movement.y * this.speed;

    this.x += this.vx * worldDt;
    this.y += this.vy * worldDt;

    this.x = clamp(this.x, this.radius, arenaWidth - this.radius);
    this.y = clamp(this.y, this.radius, arenaHeight - this.radius);
  }

  emitContactKnockback(strength) {
    const angle = randomRange(0, Math.PI * 2);
    const vector = vectorFromAngle(angle, strength);
    this.vx += vector.x;
    this.vy += vector.y;
  }

  takeDamage(amount) {
    if (this.dead) return false;

    this.hp -= amount;
    this.flash = 1;

    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }

    return false;
  }

  render(ctx) {
    if (this.dead) return;

    const shadowAlpha = this.type === ENEMY_TYPES.MINIBOSS ? 0.34 : 0.24;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius * 0.62, this.radius * 0.92, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y);

    const heading = Math.atan2(this.vy, this.vx);
    if (this.type !== ENEMY_TYPES.MINIBOSS) {
      ctx.rotate(heading + Math.PI / 2);
    } else {
      ctx.rotate(this.behaviorTime * 0.2);
    }

    const pulse = (Math.sin(this.behaviorTime * 2.8) + 1) * 0.5;
    const glow = this.type === ENEMY_TYPES.MINIBOSS
      ? CONFIG.VISUAL.ENEMY_MINIBOSS_GLOW + pulse * 7
      : CONFIG.VISUAL.ENEMY_GLOW;

    ctx.fillStyle = PALETTE.ENEMY;
    ctx.shadowBlur = glow;
    ctx.shadowColor = PALETTE.ENEMY;
    drawShape(ctx, this.type, this.radius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(40, 8, 15, 0.48)";
    drawShape(ctx, this.type, this.radius * 0.62);
    ctx.fill();

    if (this.flash > 0) {
      ctx.globalAlpha = this.flash * 0.6;
      ctx.fillStyle = PALETTE.WHITE;
      drawShape(ctx, this.type, this.radius * 1.02);
      ctx.fill();
    }

    if (this.type === ENEMY_TYPES.MINIBOSS) {
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.rotate(-this.behaviorTime * 0.2);
      ctx.translate(0, this.radius + 14);
      ctx.fillStyle = "rgba(12, 10, 14, 0.9)";
      ctx.fillRect(-this.radius, -4, this.radius * 2, 8);
      ctx.fillStyle = PALETTE.ENEMY;
      ctx.fillRect(-this.radius, -4, this.radius * 2 * hpRatio, 8);
    }

    ctx.restore();
  }
}
