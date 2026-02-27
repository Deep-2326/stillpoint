import { PALETTE } from "../config.js";
import { normalize } from "../utils.js";

export class Bullet {
  constructor({
    x,
    y,
    angle = 0,
    speed = 0,
    vx = null,
    vy = null,
    radius,
    damage,
    lifetime,
    color,
    fromEnemy = false,
    pierceCount = 0
  }) {
    this.x = x;
    this.y = y;

    if (vx === null || vy === null) {
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    } else {
      this.vx = vx;
      this.vy = vy;
    }

    this.radius = radius;
    this.damage = damage;
    this.lifetime = lifetime;
    this.color = color;
    this.fromEnemy = fromEnemy;
    this.age = 0;
    this.dead = false;

    this.remainingHits = 1 + Math.max(0, pierceCount);
    this.hitTargets = new Set();

    this.trail = [];
    this.trailTimer = 0;
    this.trailInterval = 0.014;
    this.maxTrailPoints = 11;
  }

  update(dt) {
    if (this.dead) return;

    this.age += dt;
    if (this.age >= this.lifetime) {
      this.dead = true;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.trailTimer += dt;
    if (this.trailTimer >= this.trailInterval) {
      this.trailTimer = 0;
      this.trail.push({ x: this.x, y: this.y, life: 0.12 });
      if (this.trail.length > this.maxTrailPoints) {
        this.trail.shift();
      }
    }

    for (let i = this.trail.length - 1; i >= 0; i -= 1) {
      const point = this.trail[i];
      point.life -= dt;
      if (point.life <= 0) {
        this.trail.splice(i, 1);
      }
    }
  }

  registerHit(targetId) {
    if (this.hitTargets.has(targetId)) {
      return false;
    }

    this.hitTargets.add(targetId);
    this.remainingHits -= 1;
    if (this.remainingHits <= 0) {
      this.dead = true;
    }
    return true;
  }

  isOutOfBounds(width, height, padding = 80) {
    return (
      this.x < -padding ||
      this.y < -padding ||
      this.x > width + padding ||
      this.y > height + padding
    );
  }

  render(ctx) {
    if (this.dead) return;

    const direction = normalize(this.vx, this.vy);
    const tailLength = this.fromEnemy ? 20 : 30;
    const tailX = this.x - direction.x * tailLength;
    const tailY = this.y - direction.y * tailLength;

    const accent = this.fromEnemy ? "rgba(255, 42, 77, 0.75)" : this.color;
    const core = this.fromEnemy ? "rgba(255, 42, 77, 0.95)" : PALETTE.WHITE;

    ctx.save();

    for (let i = 0; i < this.trail.length; i += 1) {
      const point = this.trail[i];
      const ratio = Math.max(0, point.life / 0.12);
      ctx.globalAlpha = ratio * (this.fromEnemy ? 0.3 : 0.42);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(point.x, point.y, this.radius * (0.55 + ratio * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    const gradient = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
    gradient.addColorStop(0, this.fromEnemy ? "rgba(255, 42, 77, 0)" : "rgba(0, 245, 255, 0)");
    gradient.addColorStop(0.6, this.fromEnemy ? "rgba(255, 42, 77, 0.38)" : "rgba(0, 245, 255, 0.42)");
    gradient.addColorStop(1, this.fromEnemy ? "rgba(255, 42, 77, 1)" : "rgba(0, 245, 255, 1)");

    ctx.globalAlpha = 1;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = this.fromEnemy ? 3.2 : 4.1;
    ctx.lineCap = "round";
    ctx.shadowBlur = this.fromEnemy ? 8 : 12;
    ctx.shadowColor = accent;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.strokeStyle = core;
    ctx.lineWidth = this.fromEnemy ? 1.2 : 1.6;
    ctx.shadowBlur = this.fromEnemy ? 5 : 7;
    ctx.shadowColor = core;
    ctx.beginPath();
    ctx.moveTo(this.x - direction.x * (tailLength * 0.3), this.y - direction.y * (tailLength * 0.3));
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = this.fromEnemy ? "rgba(120, 16, 34, 0.95)" : PALETTE.WHITE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
