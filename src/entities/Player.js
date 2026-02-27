import { CONFIG, PALETTE } from "../config.js";
import { drawNeonCircle, drawNeonLine } from "../render/neon.js";
import { angleTo, approach, clamp, length, normalize } from "../utils.js";

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.radius = CONFIG.PLAYER.RADIUS;
    this.maxHp = CONFIG.PLAYER.MAX_HP;
    this.hp = this.maxHp;

    this.aimAngle = 0;
    this.shootCooldown = 0;

    this.dashCooldownTimer = 0;
    this.dashTimeRemaining = 0;
    this.invulnerableTimer = 0;
    this.contactDamageCooldown = 0;

    this.damageFlash = 0;

    this.afterimages = [];
    this.afterimageTimer = 0;

    this.motionTrail = [];
    this.motionTrailTimer = 0;

    this.doubleShot = false;
    this.piercingBullets = false;
    this.dashCooldownMultiplier = 1;
    this.bulletSpeedMultiplier = 1;
    this.comboAmplifier = 1;
  }

  getSpeed() {
    return length(this.vx, this.vy);
  }

  isDashing() {
    return this.dashTimeRemaining > 0;
  }

  canTakeDamage() {
    return this.invulnerableTimer <= 0;
  }

  update(dt, input, arenaWidth, arenaHeight, emitPlayerBullet) {
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    this.contactDamageCooldown = Math.max(0, this.contactDamageCooldown - dt);
    this.damageFlash = Math.max(0, this.damageFlash - dt * 8);

    this.aimAngle = angleTo(this.x, this.y, input.mouse.x, input.mouse.y);

    const movementInput = input.getMoveVector();

    if (this.isDashing()) {
      this.dashTimeRemaining = Math.max(0, this.dashTimeRemaining - dt);
    } else {
      const accel = CONFIG.PLAYER.ACCELERATION * dt;
      this.vx += movementInput.x * accel;
      this.vy += movementInput.y * accel;

      if (movementInput.x === 0) {
        this.vx = approach(this.vx, 0, CONFIG.PLAYER.FRICTION * dt);
      }

      if (movementInput.y === 0) {
        this.vy = approach(this.vy, 0, CONFIG.PLAYER.FRICTION * dt);
      }

      const speed = this.getSpeed();
      if (speed > CONFIG.PLAYER.MAX_SPEED) {
        const dir = normalize(this.vx, this.vy);
        this.vx = dir.x * CONFIG.PLAYER.MAX_SPEED;
        this.vy = dir.y * CONFIG.PLAYER.MAX_SPEED;
      }

      if (input.consumeDash() && this.dashCooldownTimer <= 0) {
        this.startDash(movementInput);
      }
    }

    if (this.isDashing()) {
      this.afterimageTimer -= dt;
      if (this.afterimageTimer <= 0) {
        this.afterimageTimer = CONFIG.PLAYER.TRAIL_SPAWN_INTERVAL;
        this.afterimages.push({
          x: this.x,
          y: this.y,
          angle: this.aimAngle,
          life: CONFIG.PLAYER.TRAIL_LIFETIME,
          maxLife: CONFIG.PLAYER.TRAIL_LIFETIME
        });
      }
    }

    for (let i = this.afterimages.length - 1; i >= 0; i -= 1) {
      this.afterimages[i].life -= dt;
      if (this.afterimages[i].life <= 0) {
        this.afterimages.splice(i, 1);
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.x = clamp(this.x, this.radius, arenaWidth - this.radius);
    this.y = clamp(this.y, this.radius, arenaHeight - this.radius);

    this.motionTrailTimer -= dt;
    if (this.motionTrailTimer <= 0) {
      this.motionTrailTimer = 0.025;
      this.motionTrail.push({ x: this.x, y: this.y, angle: this.aimAngle });
      const max = CONFIG.PLAYER.MOTION_BLUR_POINTS;
      while (this.motionTrail.length > max) {
        this.motionTrail.shift();
      }
    }

    if (input.isMouseDown(0) && this.shootCooldown <= 0) {
      this.shootCooldown = CONFIG.PLAYER.SHOOT_INTERVAL;
      this.fire(emitPlayerBullet);
    }
  }

  fire(emitPlayerBullet) {
    const baseSpeed = CONFIG.PLAYER.BULLET_SPEED * this.bulletSpeedMultiplier;
    const pierceCount = this.piercingBullets ? 1 : 0;

    const shotAngles = this.doubleShot
      ? [this.aimAngle - 0.08, this.aimAngle + 0.08]
      : [this.aimAngle];

    for (const angle of shotAngles) {
      emitPlayerBullet({
        x: this.x + Math.cos(angle) * (this.radius + 8),
        y: this.y + Math.sin(angle) * (this.radius + 8),
        angle,
        speed: baseSpeed,
        radius: CONFIG.PLAYER.BULLET_RADIUS,
        damage: CONFIG.PLAYER.BULLET_DAMAGE,
        lifetime: CONFIG.PLAYER.BULLET_LIFETIME,
        color: PALETTE.PLAYER,
        fromEnemy: false,
        pierceCount
      });
    }
  }

  startDash(movementInput) {
    let direction = movementInput;
    if (direction.x === 0 && direction.y === 0) {
      direction = {
        x: Math.cos(this.aimAngle),
        y: Math.sin(this.aimAngle)
      };
    }

    this.vx = direction.x * CONFIG.PLAYER.DASH_SPEED;
    this.vy = direction.y * CONFIG.PLAYER.DASH_SPEED;
    this.dashTimeRemaining = CONFIG.PLAYER.DASH_DURATION;
    this.dashCooldownTimer = CONFIG.PLAYER.DASH_COOLDOWN * this.dashCooldownMultiplier;
    this.invulnerableTimer = CONFIG.PLAYER.DASH_INVULNERABLE_TIME;
    this.afterimageTimer = 0;
  }

  takeDamage(amount) {
    if (!this.canTakeDamage()) {
      return false;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.damageFlash = 1;
    this.invulnerableTimer = 0.08;
    return true;
  }

  renderDashStreak(ctx) {
    const heading = this.getSpeed() > 0.1 ? Math.atan2(this.vy, this.vx) : this.aimAngle;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(heading);

    for (let i = 0; i < 3; i += 1) {
      const alpha = 0.34 - i * 0.1;
      const length = 30 + i * 18;
      const width = 8 + i * 4;
      const offset = this.radius + i * 3;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = PALETTE.PLAYER;
      ctx.beginPath();
      ctx.moveTo(-offset - length, 0);
      ctx.lineTo(-offset, -width);
      ctx.lineTo(-offset, width);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  render(ctx) {
    for (let i = 0; i < this.motionTrail.length; i += 1) {
      const ghost = this.motionTrail[i];
      const ratio = (i + 1) / this.motionTrail.length;
      drawNeonCircle(ctx, {
        x: ghost.x,
        y: ghost.y,
        radius: this.radius * (0.5 + ratio * 0.25),
        color: PALETTE.PLAYER,
        glow: 10,
        alpha: 0.06 + ratio * 0.08
      });
    }

    for (const ghost of this.afterimages) {
      const alpha = ghost.life / ghost.maxLife;
      drawNeonCircle(ctx, {
        x: ghost.x,
        y: ghost.y,
        radius: this.radius * 0.95,
        color: PALETTE.PLAYER,
        glow: 16,
        alpha: alpha * 0.24
      });
    }

    if (this.isDashing()) {
      this.renderDashStreak(ctx);
    }

    drawNeonCircle(ctx, {
      x: this.x,
      y: this.y,
      radius: this.radius + 3,
      color: PALETTE.PLAYER,
      glow: CONFIG.VISUAL.PLAYER_GLOW,
      alpha: 0.22
    });

    drawNeonCircle(ctx, {
      x: this.x,
      y: this.y,
      radius: this.radius,
      color: PALETTE.PLAYER,
      glow: CONFIG.VISUAL.PLAYER_CORE_GLOW,
      alpha: 0.95
    });

    drawNeonCircle(ctx, {
      x: this.x - Math.cos(this.aimAngle) * 3,
      y: this.y - Math.sin(this.aimAngle) * 3,
      radius: this.radius * 0.56,
      color: "rgba(6, 20, 26, 0.7)",
      glow: 0,
      alpha: 1
    });

    const fx = this.x + Math.cos(this.aimAngle) * (this.radius + 9);
    const fy = this.y + Math.sin(this.aimAngle) * (this.radius + 9);
    drawNeonLine(ctx, {
      x1: this.x + Math.cos(this.aimAngle) * 6,
      y1: this.y + Math.sin(this.aimAngle) * 6,
      x2: fx,
      y2: fy,
      color: PALETTE.WHITE,
      width: 2.4,
      glow: 8,
      alpha: 0.95
    });

    drawNeonCircle(ctx, {
      x: this.x + Math.cos(this.aimAngle) * 4,
      y: this.y + Math.sin(this.aimAngle) * 4,
      radius: this.radius * 0.2,
      color: PALETTE.WHITE,
      glow: 6,
      alpha: 0.88
    });

    if (this.damageFlash > 0) {
      drawNeonCircle(ctx, {
        x: this.x,
        y: this.y,
        radius: this.radius + 2,
        color: PALETTE.WHITE,
        glow: 10,
        alpha: this.damageFlash * 0.4
      });
    }

    if (this.dashCooldownTimer <= 0) {
      ctx.save();
      ctx.strokeStyle = PALETTE.PLAYER;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 7, -Math.PI * 0.18, Math.PI * 0.18);
      ctx.stroke();
      ctx.restore();
    }
  }
}
