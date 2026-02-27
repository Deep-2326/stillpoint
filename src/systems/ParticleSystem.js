import { CONFIG, PALETTE } from "../config.js";
import { Particle } from "../entities/Particle.js";
import { randomRange, vectorFromAngle } from "../utils.js";

function pickShape(shapeMix) {
  const dotWeight = shapeMix.dot ?? 0;
  const sparkWeight = shapeMix.spark ?? 0;
  const debrisWeight = shapeMix.debris ?? 0;
  const total = dotWeight + sparkWeight + debrisWeight;

  if (total <= 0) return "dot";

  const roll = Math.random() * total;
  if (roll < sparkWeight) return "spark";
  if (roll < sparkWeight + debrisWeight) return "debris";
  return "dot";
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  reset() {
    this.particles.length = 0;
  }

  spawnBurst(x, y, {
    color = PALETTE.ENEMY,
    count = 12,
    speedMin = 60,
    speedMax = 260,
    life = CONFIG.PARTICLES.BASE_LIFETIME,
    sizeMin = 1.5,
    sizeMax = 4,
    drag = CONFIG.PARTICLES.DRAG,
    glow = 12,
    arcCenter = null,
    arcSpread = Math.PI * 2,
    shapeMix = { spark: 0.5, debris: 0.3, dot: 0.2 }
  } = {}) {
    const center = arcCenter ?? randomRange(0, Math.PI * 2);

    for (let i = 0; i < count; i += 1) {
      const angle = center + randomRange(-arcSpread * 0.5, arcSpread * 0.5);
      const speed = randomRange(speedMin, speedMax);
      const direction = vectorFromAngle(angle, speed);
      const shape = pickShape(shapeMix);

      this.particles.push(new Particle({
        x,
        y,
        vx: direction.x,
        vy: direction.y,
        size: randomRange(sizeMin, sizeMax),
        life: randomRange(life * 0.65, life * 1.25),
        color,
        drag,
        glow,
        shape,
        spin: randomRange(-9, 9),
        rotation: randomRange(0, Math.PI * 2)
      }));
    }
  }

  spawnTrail(x, y, color, velocityX, velocityY) {
    this.particles.push(new Particle({
      x,
      y,
      vx: velocityX * 0.04 + randomRange(-18, 18),
      vy: velocityY * 0.04 + randomRange(-18, 18),
      size: randomRange(0.9, 1.8),
      life: randomRange(0.08, 0.16),
      color,
      drag: 8,
      glow: 7,
      shape: "dot",
      spin: randomRange(-3, 3),
      rotation: randomRange(0, Math.PI * 2)
    }));
  }

  spawnImpact(x, y, color) {
    this.spawnBurst(x, y, {
      color,
      count: 8,
      speedMin: 70,
      speedMax: 190,
      life: CONFIG.PARTICLES.HIT_LIFETIME,
      sizeMin: 0.9,
      sizeMax: 2.4,
      glow: 10,
      shapeMix: { spark: 0.7, debris: 0.3, dot: 0 }
    });
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
