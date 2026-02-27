export const GAME_STATES = {
  MENU: "menu",
  PLAYING: "playing",
  WAVE_CLEAR: "wave_clear",
  UPGRADE: "upgrade",
  GAME_OVER: "game_over"
};

export const ENEMY_TYPES = {
  CHASER: "chaser",
  SHOOTER: "shooter",
  BURST: "burst",
  FAST: "fast_fragile",
  MINIBOSS: "miniboss"
};

export const CONFIG = {
  CANVAS: {
    WIDTH: 1280,
    HEIGHT: 720,
    BACKGROUND: "#0f0f14"
  },
  WORLD: {
    GRID_SIZE: 64,
    GRID_ALPHA: 0.13,
    GRID_LINE_WIDTH: 1
  },
  TIMING: {
    MAX_DT: 0.05,
    WAVE_CLEAR_DELAY: 1.2,
    WAVE_INTRO_DURATION: 1.6,
    DAMAGE_FLASH_DURATION: 0.2,
    SHAKE_DAMPING: 12
  },
  TIME_CONTROL: {
    STATIONARY_THRESHOLD: 18,
    MOVING_SCALE: 1,
    STATIONARY_SCALE: 0.05,
    TRANSITION_SPEED: 9,
    UPGRADE_MULTIPLIER_STEP: 0.82,
    MIN_STATIONARY_SCALE: 0.015
  },
  PLAYER: {
    RADIUS: 16,
    MAX_HP: 120,
    ACCELERATION: 2600,
    FRICTION: 2200,
    MAX_SPEED: 380,
    DASH_SPEED: 980,
    DASH_DURATION: 0.16,
    DASH_COOLDOWN: 1.1,
    DASH_INVULNERABLE_TIME: 0.1,
    CONTACT_DAMAGE_COOLDOWN: 0.45,
    SHOOT_INTERVAL: 0.15,
    BULLET_SPEED: 760,
    BULLET_DAMAGE: 18,
    BULLET_RADIUS: 4,
    BULLET_LIFETIME: 1.4,
    TRAIL_LIFETIME: 0.22,
    TRAIL_SPAWN_INTERVAL: 0.018
  },
  ENEMIES: {
    [ENEMY_TYPES.CHASER]: {
      RADIUS: 16,
      HP: 40,
      SPEED: 120,
      SCORE: 100,
      CONTACT_DAMAGE: 16,
      SHOOT_INTERVAL: 0,
      PROJECTILE_SPEED: 0
    },
    [ENEMY_TYPES.SHOOTER]: {
      RADIUS: 18,
      HP: 62,
      SPEED: 88,
      SCORE: 160,
      CONTACT_DAMAGE: 18,
      SHOOT_INTERVAL: 1.5,
      PROJECTILE_SPEED: 280,
      DESIRED_RANGE: 310
    },
    [ENEMY_TYPES.BURST]: {
      RADIUS: 20,
      HP: 84,
      SPEED: 78,
      SCORE: 220,
      CONTACT_DAMAGE: 20,
      SHOOT_INTERVAL: 2.6,
      PROJECTILE_SPEED: 300,
      BURST_COUNT: 3,
      BURST_DELAY: 0.14,
      DESIRED_RANGE: 360
    },
    [ENEMY_TYPES.FAST]: {
      RADIUS: 12,
      HP: 24,
      SPEED: 212,
      SCORE: 130,
      CONTACT_DAMAGE: 14,
      SHOOT_INTERVAL: 0,
      PROJECTILE_SPEED: 0
    },
    [ENEMY_TYPES.MINIBOSS]: {
      RADIUS: 34,
      HP: 440,
      SPEED: 76,
      SCORE: 1600,
      CONTACT_DAMAGE: 30,
      SHOOT_INTERVAL: 1.8,
      PROJECTILE_SPEED: 330,
      BURST_COUNT: 8,
      BURST_SPREAD: Math.PI * 2
    },
    BULLET: {
      RADIUS: 5,
      DAMAGE: 18,
      LIFETIME: 3
    },
    SPAWN_PADDING: 48
  },
  WAVES: {
    BASE_ENEMY_COUNT: 5,
    COUNT_GROWTH: 1.35,
    FAST_UNLOCK_WAVE: 2,
    SHOOTER_UNLOCK_WAVE: 3,
    BURST_UNLOCK_WAVE: 5,
    MINIBOSS_EVERY: 4,
    SPAWN_INTERVAL: 0.38
  },
  PARTICLES: {
    BASE_LIFETIME: 0.5,
    HIT_LIFETIME: 0.2,
    DRAG: 5,
    ENEMY_DEATH_COUNT: 24,
    PLAYER_SHOT_COUNT: 2,
    ENEMY_SHOT_COUNT: 2,
    TRAIL_COUNT: 1
  },
  CAMERA: {
    DAMAGE_SHAKE: 8,
    HIT_SHAKE: 3
  },
  SCORING: {
    COMBO_TIMEOUT: 2,
    COMBO_STEP: 0.2,
    COMBO_DAMAGE_RESET: true
  },
  UI: {
    FONT_FAMILY: "'Rajdhani', sans-serif",
    HUD_GLOW: "rgba(0, 217, 255, 0.85)",
    ALERT_GLOW: "rgba(255, 52, 86, 0.9)",
    WAVE_GLOW: "rgba(202, 88, 255, 0.95)",
    TRANSITION_SPEED: 10
  },
  UPGRADES: {
    DOUBLE_SHOT: {
      id: "double_shot",
      title: "Double Shot",
      description: "Fire two rounds with a narrow spread.",
      accent: "#1cd9ff"
    },
    PIERCING: {
      id: "piercing",
      title: "Piercing Bullets",
      description: "Bullets pass through one extra target.",
      accent: "#45f5ff"
    },
    DASH_COOLDOWN: {
      id: "dash_cooldown",
      title: "Fast Dash",
      description: "Reduce dash cooldown by 18%.",
      accent: "#ff4fd0"
    },
    TIME_SLOW: {
      id: "time_slow",
      title: "Stillpoint Core",
      description: "Standing still slows the world even more.",
      accent: "#8f7cff"
    },
    BULLET_SPEED: {
      id: "bullet_speed",
      title: "Bullet Speed Up",
      description: "Increase bullet velocity by 18%.",
      accent: "#5ad9ff"
    },
    COMBO_AMPLIFIER: {
      id: "combo_amp",
      title: "Combo Amplifier",
      description: "Increase combo multiplier growth.",
      accent: "#ff7df4"
    }
  }
};
