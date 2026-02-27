import { CONFIG } from "../config.js";
import { clamp, lerp } from "../utils.js";

export class TimeController {
  constructor() {
    this.scale = CONFIG.TIME_CONTROL.MOVING_SCALE;
    this.stationaryMultiplier = 1;
  }

  update(playerSpeed, dt) {
    const stationaryScale = clamp(
      CONFIG.TIME_CONTROL.STATIONARY_SCALE * this.stationaryMultiplier,
      CONFIG.TIME_CONTROL.MIN_STATIONARY_SCALE,
      CONFIG.TIME_CONTROL.STATIONARY_SCALE
    );

    const target = playerSpeed <= CONFIG.TIME_CONTROL.STATIONARY_THRESHOLD
      ? stationaryScale
      : CONFIG.TIME_CONTROL.MOVING_SCALE;

    const alpha = 1 - Math.exp(-CONFIG.TIME_CONTROL.TRANSITION_SPEED * dt);
    this.scale = lerp(this.scale, target, alpha);
  }

  makeStationarySlowStronger() {
    this.stationaryMultiplier *= CONFIG.TIME_CONTROL.UPGRADE_MULTIPLIER_STEP;
  }

  getScale() {
    return this.scale;
  }

  applyToDelta(dt) {
    return dt * this.scale;
  }
}
