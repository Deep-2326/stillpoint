import { clamp } from "../utils.js";

export class Particle {
  constructor({
    x,
    y,
    vx,
    vy,
    size,
    life,
    color,
    drag = 4,
    glow = 12
  }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.drag = drag;
    this.glow = glow;
    this.dead = false;
  }

  update(dt) {
    if (this.dead) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }

    const damping = Math.exp(-this.drag * dt);
    this.vx *= damping;
    this.vy *= damping;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    if (this.dead) return;

    const alpha = clamp(this.life / this.maxLife, 0, 1);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = this.glow;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha + 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
