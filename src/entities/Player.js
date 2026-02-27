import { CONFIG } from "../config.js";
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
        color: "#1de7ff",
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

  render(ctx) {
    for (const ghost of this.afterimages) {
      const alpha = ghost.life / ghost.maxLife;
      ctx.save();
      ctx.translate(ghost.x, ghost.y);
      ctx.rotate(ghost.angle);
      ctx.globalAlpha = alpha * 0.42;
      ctx.fillStyle = "#1de7ff";
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#1de7ff";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);

    ctx.shadowBlur = 24;
    ctx.shadowColor = "#26dbff";
    ctx.fillStyle = "#14c5f8";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#baf6ff";
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(5, -5, this.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#d7ffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(this.radius + 10, 0);
    ctx.stroke();

    if (this.damageFlash > 0) {
      ctx.globalAlpha = this.damageFlash * 0.75;
      ctx.fillStyle = "#ff9bb0";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.dashCooldownTimer <= 0) {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "#57f2ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, -Math.PI * 0.2, Math.PI * 0.2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
