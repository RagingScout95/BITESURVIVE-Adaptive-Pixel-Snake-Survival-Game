## BiteSurvive — Adaptive Pixel Snake Survival Game

Grid-based pixel snake survival game (HTML5 Canvas) with **energy/hunger**, **procedural levels**, and **predator snakes**.  
Optional Spring Boot backend provides a **GraphQL leaderboard**.

---

## Features

- **Pixel-perfect rendering** (16×16 tiles)
- **Energy system** (move + turn drains energy)
- **Procedural maps** (walls + portals + food)
- **Enemy snakes** (AI predators)
- **Leaderboard backend** (Spring Boot + GraphQL + Postgres)

---

## Controls

- **Move**: WASD or Arrow Keys
- **Pause**: P

---

## Quick start (frontend only)

From the repo root:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

Windows shortcut:

```bash
.\run-frontend.bat
```

---

## Backend (optional leaderboard)

### Requirements

- Java **17**
- PostgreSQL

### Configure database

The backend reads these environment variables (with sensible defaults):

- `DB_URL` (default: `jdbc:postgresql://localhost:5432/bitesurvive`)
- `DB_USER` (default: `postgres`)
- `DB_PASSWORD` (default: `postgres`)

### Run backend

```bash
.\backend\run-backend.bat
```

Backend runs on `http://localhost:8080`  
GraphQL endpoint: `http://localhost:8080/graphql`

---

## Project structure

- `index.html`, `styles.css` — UI + layout
- `js/` — game logic + renderer
- `assets/` — sprite atlas + background
- `backend/` — Spring Boot GraphQL API (leaderboard)

---

## Sprite atlas (assets)

Sprite atlas: `assets/all_stuff.png` (16×16 tiles, 16 columns).  
**Direction is encoded in the tile selection** (no runtime rotation for snake sprites).

---

## License

MIT — see `LICENSE`.

