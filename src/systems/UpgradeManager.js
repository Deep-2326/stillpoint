import { CONFIG } from "../config.js";
import { pickRandom } from "../utils.js";

const ONE_TIME_UPGRADES = new Set([
  CONFIG.UPGRADES.DOUBLE_SHOT.id,
  CONFIG.UPGRADES.PIERCING.id
]);

export class UpgradeManager {
  constructor() {
    this.upgradePool = Object.values(CONFIG.UPGRADES);
  }

  getChoices(player, count = 3) {
    const available = this.upgradePool.filter((upgrade) => {
      if (upgrade.id === CONFIG.UPGRADES.DOUBLE_SHOT.id && player.doubleShot) return false;
      if (upgrade.id === CONFIG.UPGRADES.PIERCING.id && player.piercingBullets) return false;
      return true;
    });

    const source = available.length >= count ? available : this.upgradePool;
    const picked = [];
    const ids = new Set();

    while (picked.length < count) {
      const candidate = pickRandom(source);
      if (!ids.has(candidate.id)) {
        ids.add(candidate.id);
        picked.push(candidate);
      }

      if (source.length <= count && picked.length === source.length) {
        break;
      }
    }

    return picked;
  }

  applyUpgrade(upgradeId, player, game) {
    switch (upgradeId) {
      case CONFIG.UPGRADES.DOUBLE_SHOT.id:
        player.doubleShot = true;
        break;
      case CONFIG.UPGRADES.PIERCING.id:
        player.piercingBullets = true;
        break;
      case CONFIG.UPGRADES.DASH_COOLDOWN.id:
        player.dashCooldownMultiplier = Math.max(0.45, player.dashCooldownMultiplier * 0.82);
        break;
      case CONFIG.UPGRADES.TIME_SLOW.id:
        game.timeController.makeStationarySlowStronger();
        break;
      case CONFIG.UPGRADES.BULLET_SPEED.id:
        player.bulletSpeedMultiplier *= 1.18;
        break;
      case CONFIG.UPGRADES.COMBO_AMPLIFIER.id:
        player.comboAmplifier += 0.25;
        break;
      default:
        break;
    }

    if (ONE_TIME_UPGRADES.has(upgradeId)) {
      game.permanentUpgrades.add(upgradeId);
    }
  }
}
