import { CONFIG } from "../config.js";
import { distanceSquared } from "../utils.js";

export class CollisionSystem {
  resolve(player, enemies, playerBullets, enemyBullets) {
    const result = {
      kills: [],
      enemyHit: false,
      playerHit: false,
      damageTaken: 0,
      hitPoints: []
    };

    for (const bullet of playerBullets) {
      if (bullet.dead) continue;

      for (const enemy of enemies) {
        if (enemy.dead) continue;

        const radii = bullet.radius + enemy.radius;
        if (distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) <= radii * radii) {
          const isNewTarget = bullet.registerHit(enemy.id);
          if (!isNewTarget) {
            continue;
          }

          result.enemyHit = true;
          result.hitPoints.push({ x: bullet.x, y: bullet.y, color: "#ff4869" });

          const killed = enemy.takeDamage(bullet.damage);
          if (killed) {
            result.kills.push(enemy);
          }

          if (bullet.dead) {
            break;
          }
        }
      }
    }

    for (const bullet of enemyBullets) {
      if (bullet.dead) continue;

      const radii = bullet.radius + player.radius;
      if (distanceSquared(bullet.x, bullet.y, player.x, player.y) <= radii * radii) {
        bullet.dead = true;
        const didDamage = player.takeDamage(bullet.damage);
        if (didDamage) {
          result.playerHit = true;
          result.damageTaken += bullet.damage;
          result.hitPoints.push({ x: player.x, y: player.y, color: "#ff7a92" });
        }
      }
    }

    if (player.contactDamageCooldown <= 0) {
      for (const enemy of enemies) {
        if (enemy.dead) continue;

        const radii = enemy.radius + player.radius;
        if (distanceSquared(enemy.x, enemy.y, player.x, player.y) <= radii * radii) {
          const didDamage = player.takeDamage(enemy.contactDamage);
          if (didDamage) {
            result.playerHit = true;
            result.damageTaken += enemy.contactDamage;
            result.hitPoints.push({ x: player.x, y: player.y, color: "#ff8a8a" });
            player.contactDamageCooldown = CONFIG.PLAYER.CONTACT_DAMAGE_COOLDOWN;
            enemy.emitContactKnockback(120);
          }
          break;
        }
      }
    }

    return result;
  }
}
