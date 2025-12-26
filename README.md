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
- **Atlas columns**: 16
- **Indexing**: `(row, col)` where `(0,0)` is top-left
- **Flat index**: `index = row * 16 + col`

### Direction is encoded in tiles

Snake, enemy snake, and walls **do not rotate at runtime**.  
Each direction/turn already exists as a dedicated tile in the atlas, so the code selects the correct tile index.

### Player snake tiles (by `(row,col)` in the atlas)

- **Tail**:
  - `(0,0)` right, `(0,1)` left, `(1,0)` up, `(1,1)` down
- **Body (straight)**:
  - `(2,0)` vertical, `(2,1)` horizontal
- **Body (turns / corners)**:
  - `(0,2)` BR, `(0,3)` BL, `(1,2)` TR, `(1,3)` TL
- **Head**:
  - `(2,2)` right, `(2,3)` left, `(3,2)` up, `(3,3)` down

You can see the numeric mapping in `js/constants.js` under `TILES.*`.

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

- **Head**: tile matches current movement direction.
- **Tail**: tile is chosen from the last two segments so the tail “faces” the correct direction relative to the body.
- **Body**:
  - straight segments choose vertical/horizontal
  - corners choose one of the 4 turn tiles based on the in/out directions

Rendering happens in `js/main.js` and draws each segment with `SpriteRenderer.drawTile(...)`.

### Enemy rendering

Enemy snakes use the same logic as player snake; only their atlas row offset differs (handled in `js/spriteRenderer.js`).

## Troubleshooting

- **Blank screen / no sprites**: make sure you run from a local server (don’t open `index.html` directly) and confirm `assets/all_stuff.png` exists.
- **Backend errors**: confirm PostgreSQL is running and `DB_URL/DB_USER/DB_PASSWORD` are set correctly.

## License

MIT (see `LICENSE`).

