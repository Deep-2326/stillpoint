import { CONFIG } from "../config.js";
import { Particle } from "../entities/Particle.js";
import { randomRange, vectorFromAngle } from "../utils.js";

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  reset() {
    this.particles.length = 0;
  }

  spawnBurst(x, y, {
    color = "#ff3b60",
    count = 12,
    speedMin = 60,
    speedMax = 260,
    life = CONFIG.PARTICLES.BASE_LIFETIME,
    sizeMin = 1.5,
    sizeMax = 4,
    drag = CONFIG.PARTICLES.DRAG,
    glow = 12
  } = {}) {
    for (let i = 0; i < count; i += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(speedMin, speedMax);
      const direction = vectorFromAngle(angle, speed);

      this.particles.push(new Particle({
        x,
        y,
        vx: direction.x,
        vy: direction.y,
        size: randomRange(sizeMin, sizeMax),
        life: randomRange(life * 0.65, life * 1.25),
        color,
        drag,
        glow
      }));
    }
  }

  spawnTrail(x, y, color, velocityX, velocityY) {
    this.particles.push(new Particle({
      x,
      y,
      vx: velocityX * 0.05 + randomRange(-20, 20),
      vy: velocityY * 0.05 + randomRange(-20, 20),
      size: randomRange(1, 2.2),
      life: randomRange(0.08, 0.16),
      color,
      drag: 8,
      glow: 8
    }));
  }

  update(worldDt) {
    for (const particle of this.particles) {
      particle.update(worldDt);
    }

    this.particles = this.particles.filter((particle) => !particle.dead);
  }

  render(ctx) {
    for (const particle of this.particles) {
      particle.render(ctx);
    }
  }
}
