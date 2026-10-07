# Stillblocks ✳

A little room to play. A warm, keyboard-first falling-blocks arcade with gentle animation, ghost landing guides, a three-piece preview, and increasing difficulty.

## Play locally

No install or build required. Serve the `dist` directory:

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173 and press Enter.

| Key        | Action                           |
| ---------- | -------------------------------- |
| Enter      | Start / resume / confirm restart |
| ← / →      | Move                             |
| ↑ / X      | Rotate clockwise                 |
| Z          | Rotate counterclockwise          |
| ↓          | Soft drop                        |
| Space      | Hard drop                        |
| P / Escape | Pause / resume                   |
| R          | Request a fresh start            |
| ?          | Keyboard help                    |

Restart asks for confirmation; Escape keeps the current round paused. Switching tabs or losing focus pauses play automatically. All buttons also work with Tab and Enter/Space.

## Rules

Seven tetrominoes in shuffled seven-piece bags; 10 × 20 board; bounded rotation kicks (not a claim of standard SRS), 500 ms lock delay with at most 15 grounded resets. Clear 1/2/3/4 rows for 100/300/500/800 × level, plus 1 point per soft-drop cell and 2 per hard-drop cell. Level increases every 10 lines. Complete rows clear together before the next piece spawns.

## Checks

```sh
node --test tests/engine.test.mjs
node --check dist/app.mjs
node --check dist/engine.mjs
```

Automated engine tests and static code/security reviews are included. Browser visual and interactive QA must still be performed before production release; automated browser access was blocked in the authoring environment.

## Design and privacy

Original Stillblocks branding; ivory, charcoal and terracotta palette, elegant serif typography, and restrained motion. Decorative animations respect reduced-motion preferences. Keyboard required for gameplay; no touch controls.

The game has no accounts, analytics, cookies, browser storage, or application network calls. Fonts are bundled locally. A hosting provider may maintain access logs.

## Workflow

See [the War Room workflow](docs/workflow.md) for the actual roles and review steps used to build this game. Release awaits owner approval; owner merges the game pull request.

## Fonts

DM Sans and Instrument Serif are distributed with their authentic SIL Open Font License notices in `dist/fonts/`. Their licenses apply separately from the game code.
