# BiteSurvive — Adaptive Pixel Snake Survival Game

**BiteSurvive** is a grid-based pixel snake survival game built with **HTML5 Canvas**.  
Survive by managing **energy/hunger**, navigating **procedurally generated levels**, and avoiding **predator snakes**.

An optional **Spring Boot + GraphQL** backend is included for leaderboard persistence.

## Features

- **16×16 pixel tile rendering**
- **Energy system** (moving + turning drains energy)
- **Procedural levels** (walls, portals, food)
- **Enemy snakes** (predator AI)
- **Leaderboard backend** (GraphQL + PostgreSQL)

## Controls

- **Move**: WASD / Arrow Keys
- **Pause**: P

## Run the game (frontend)

### Option A: Python (recommended)

From the repo root:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

### Option B: Windows batch script

```bash
.\run-frontend.bat
```

## Backend (optional: leaderboard)

### Requirements

- Java **17**
- PostgreSQL

### Configure database

Create a database named `bitesurvive`, then set environment variables:

- `DB_URL` (example: `jdbc:postgresql://localhost:5432/bitesurvive`)
- `DB_USER` (example: `postgres`)
- `DB_PASSWORD` (example: `postgres`)

Easiest on Windows:

- Copy `backend/env.example` to `backend/.env`
- Edit `backend/.env` with your local DB credentials

`backend/.env` is **ignored by git** and will not be pushed.

### Run backend

```bash
.\backend\run-backend.bat
```

Backend: `http://localhost:8080`  
GraphQL: `http://localhost:8080/graphql`

## Project structure

- `index.html`, `styles.css` — UI
- `js/` — game code
- `assets/` — images/sprites
- `backend/` — leaderboard API

## Assets / sprite atlas

The game uses a **single texture atlas**: `assets/all_stuff.png`

- **Tile size**: 16×16 px
- **Atlas layout**: 8 columns × 8 rows = 64 tiles total
- **Indexing**: `(row, col)` where `(0,0)` is top-left
- **Flat index formula**: `index = row * 8 + col`

### Direction is encoded in tiles

Snake, enemy snake, and walls **do not rotate at runtime**.  
Each direction/turn already exists as a dedicated tile in the atlas, so the code selects the correct tile index.

### Atlas organization

- **Rows 0-2**: Player Snake tiles
- **Rows 3-5**: Enemy/Predatory Snake tiles (same layout as player, offset by 3 rows)
- **Rows 6-7**: Walls, Food, and Portal tiles

### Player snake tiles (by `(row,col)` in the atlas)

- **Tail** (Row 0-1):
  - `(0,0)` right →, `(0,1)` left ←, `(1,0)` up ↑, `(1,1)` down ↓
- **Body (straight)** (Row 2):
  - `(2,0)` vertical |, `(2,1)` horizontal ─
- **Body (turns)** (Row 0-1):
  - `(0,2)` bottom-right, `(0,3)` bottom-left, `(1,2)` top-right, `(1,3)` top-left
- **Head** (Row 0-1, Cols 4-5):
  - `(0,4)` right →, `(0,5)` left ←, `(1,4)` up ↑, `(1,5)` down ↓

All tile indices are defined in `js/constants.js` under `TILES.*` with clear documentation.

### Enemy snake tiles

Enemy snake uses the **same (row,col) layout** as the player snake, but located lower in the atlas (different color/style).  
Implementation detail: the renderer offsets snake tile rows by **+3 rows** for enemies (see `js/spriteRenderer.js`).

### Walls, food, portals

- **Walls**: directional tiles (no rotation) selected by neighbor connectivity (see `js/wallSystem.js`)
- **Food**: non-directional tiles (random type) (see `js/food.js`)
- **Portals**: a fixed tile index (see `js/main.js` rendering loop and `js/grid.js`)

## How the sprite selection works (high-level)

### Snake rendering

File: `js/snake.js`

- **Head**: tile matches current movement direction (uses `getSegmentTile(0)`).
- **Tail**: tile is chosen based on direction pointing away from body (uses `getSegmentTile(lastIndex)`).
- **Body**:
  - **Straight segments**: choose vertical/horizontal based on movement direction
  - **Turn segments**: use a direction mapping table with 8 specific turn variables:
    - `SNAKE_TURN_UP_LEFT`, `SNAKE_TURN_UP_RIGHT`, `SNAKE_TURN_DOWN_LEFT`, `SNAKE_TURN_DOWN_RIGHT`
    - `SNAKE_TURN_LEFT_UP`, `SNAKE_TURN_LEFT_DOWN`, `SNAKE_TURN_RIGHT_UP`, `SNAKE_TURN_RIGHT_DOWN`
    - Selected via switch-case based on incoming and outgoing directions

Rendering happens in `js/main.js` and draws each segment with `SpriteRenderer.drawTile(...)`.

### Enemy rendering

Enemy snakes use the same logic as player snake; only their atlas row offset differs (handled in `js/spriteRenderer.js`).

## Troubleshooting

- **Blank screen / no sprites**: make sure you run from a local server (don’t open `index.html` directly) and confirm `assets/all_stuff.png` exists.
- **Backend errors**: confirm PostgreSQL is running and `DB_URL/DB_USER/DB_PASSWORD` are set correctly.

## License

MIT (see `LICENSE`).

