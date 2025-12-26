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

## Troubleshooting

- **Blank screen / no sprites**: make sure you run from a local server (don’t open `index.html` directly) and confirm `assets/all_stuff.png` exists.
- **Backend errors**: confirm PostgreSQL is running and `DB_URL/DB_USER/DB_PASSWORD` are set correctly.

## License

MIT (see `LICENSE`).

