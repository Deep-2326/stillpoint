# STILLPOINT

STILLPOINT is a polished 2D top-down arena shooter built with HTML5 Canvas and vanilla JavaScript modules. You survive escalating enemy waves by mastering movement, aim, dash timing, and the core time-bending mechanic.

## Core Mechanic

Time scales with **player velocity**:

- When nearly stationary: `timeScale = 0.05`
- When moving: `timeScale = 1`

The player is never slowed. World simulation affected by time scale includes:

- Enemy movement
- Enemy shooting cadence
- Enemy bullets
- Particle simulation

This creates a tactical rhythm: pause to read and control chaos, move to reposition and commit.

## Controls

- `W A S D` or Arrow Keys: Move
- `Mouse`: Aim
- `Left Click`: Shoot
- `Space` or `Shift`: Dash
- `Enter` / Click: Start game
- `R` or `Enter`: Restart after game over
- `1 / 2 / 3` or click card: Choose upgrade between waves

## Architecture Overview

The project follows a modular ES6 class architecture:

- **Core layer** handles game loop, state transitions, time scaling, and input.
- **Entity layer** contains behavior and rendering for player, enemies, bullets, and particles.
- **Systems layer** manages wave generation, enemy orchestration, collision resolution, upgrades, and particle effects.
- **UI layer** renders HUD, transitions, and upgrade selection overlays.

Key engine rules applied:

- Separate `update()` and `render()` responsibilities.
- No gameplay spaghetti or monolithic script.
- Config-driven tuning via `src/config.js`.
- Time scaling applied only where required.
- Replay loop supports instant restart and persistent high score.

## File Structure

```text
STILLPOINT/
├── index.html                # Canvas shell + module bootstrap
├── style.css                 # Visual shell styling
├── README.md
├── LICENSE
├── assets/                   # Reserved for future media assets
└── src/
    ├── main.js               # Entry point
    ├── config.js             # Constants, tunables, enums
    ├── utils.js              # Math/helpers
    ├── core/
    │   ├── Game.js           # Main orchestrator
    │   ├── StateManager.js   # Runtime state transitions
    │   ├── TimeController.js # Dynamic world time scaling
    │   └── Input.js          # Keyboard/mouse input adapter
    ├── entities/
    │   ├── Player.js
    │   ├── Enemy.js
    │   ├── Bullet.js
    │   └── Particle.js
    ├── systems/
    │   ├── EnemyManager.js
    │   ├── WaveManager.js
    │   ├── CollisionSystem.js
    │   ├── UpgradeManager.js
    │   └── ParticleSystem.js
    └── ui/
        ├── UIManager.js
        └── UpgradeScreen.js
```

## How To Run Locally

Because this uses ES modules, run from a local static server (not plain file open):

1. In project root:
   - `python3 -m http.server 8080`
2. Open:
   - `http://localhost:8080`

Alternative local servers are also fine (`npx serve`, VS Code Live Server, etc.).

## Future Improvements

- Add elite enemy modifiers and variant attack patterns.
- Add audio SFX/music with a lightweight mixer.
- Add accessibility toggles for glow intensity and screen shake.
- Add run stats breakdown screen (accuracy, DPS, wave time).
- Add controller support and remappable inputs.
- Add deterministic seed mode for challenge runs.

## GitHub Pages Deployment

1. Push this folder to a GitHub repository.
2. In repo settings, enable **Pages**.
3. Set source to `main` branch and root (`/`).
4. Wait for build, then open the provided Pages URL.

No build step is required; this is static HTML/CSS/JS.
