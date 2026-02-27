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
    glow = 12,
    shape = "dot",
    spin = 0,
    rotation = 0
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
    this.shape = shape;
    this.spin = spin;
    this.rotation = rotation;
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
    this.rotation += this.spin * dt;
  }

  render(ctx) {
    if (this.dead) return;

    const progress = clamp(1 - this.life / this.maxLife, 0, 1);
    const alpha = Math.pow(1 - progress, 3);
    const scale = 1 - progress * 0.35;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.shadowBlur = this.glow;
    ctx.shadowColor = this.color;

    if (this.shape === "spark") {
      const angle = Math.atan2(this.vy, this.vx);
      const length = this.size * (3 + alpha * 2.4);
      const tail = length * 0.85;

      ctx.lineWidth = Math.max(1, this.size * 0.7);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - Math.cos(angle) * tail, this.y - Math.sin(angle) * tail);
      ctx.stroke();
    } else if (this.shape === "debris") {
      const w = this.size * (1.25 + alpha) * scale;
      const h = this.size * 0.75 * scale;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * scale + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
