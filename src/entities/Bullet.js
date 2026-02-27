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
    this.trailInterval = 0.015;
    this.maxTrailPoints = 10;
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
    const tailLength = this.fromEnemy ? 16 : 22;
    const tailX = this.x - direction.x * tailLength;
    const tailY = this.y - direction.y * tailLength;

    ctx.save();

    for (let i = 0; i < this.trail.length; i += 1) {
      const point = this.trail[i];
      const alpha = Math.max(0, point.life / 0.12) * 0.5;
      ctx.fillStyle = this.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(point.x, point.y, this.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.fromEnemy ? 3 : 4;
    ctx.lineCap = "round";
    ctx.shadowBlur = this.fromEnemy ? 8 : 12;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
