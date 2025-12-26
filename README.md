# README.md — Adaptive Pixel Snake (FULL IMPLEMENTATION PROMPT)

⚠️ IMPORTANT GLOBAL RULE  
DO NOT create multiple markdown or documentation files.  
ALL documentation, explanations, and design notes MUST live ONLY in this README.md.  
Do NOT generate additional `.md` files.

---

## 1. Project Goal (Read First)

Create a **top-down 2D pixel survival snake game** that uses a **single sprite atlas**, **grid-based logic**, and **code-only rotation**.

This is NOT a classic snake clone.  
The game focuses on:
- hunger and energy management
- adaptive difficulty
- procedural but ALWAYS solvable levels
- predators that compete and hunt
- clean pixel-perfect visuals

---

## 2. Technology Stack

### Frontend
- JavaScript
- HTML5 Canvas
- No external game engines
- Deterministic grid logic

### Backend
- Java Spring Boot
- GraphQL API
- PostgreSQL
- Backend is ONLY for leaderboard persistence

---

## 3. Assets (Already Provided — Do NOT Modify)

Assets are already present in the project.


Rules:
- Do NOT generate new art
- Do NOT split the atlas
- Do NOT create rotated sprite variants
- ALL orientation must be handled via code rotation only

---

## 4. Grid & World Configuration

- Tile size: **16 × 16 pixels**
- World size: **32 × 32 tiles**
- Top-down view
- Movement: grid-based, 4 directions only
- Integer scaling only (no sub-pixel rendering)

### World Wrapping
The world has no solid outer walls.
- Exiting left → reappear on right
- Exiting right → reappear on left
- Exiting top → reappear on bottom
- Exiting bottom → reappear on top

Direction, speed, and energy cost must be preserved.

---

## 5. Asset Atlas Reference (UPDATED)

The game uses a **single sprite atlas (16×16 tiles)**.  
Direction is **encoded in the tile index**, not by rotation.

### 🐍 PLAYER SNAKE TILES

| Tile ID | Description |
|---|---|
| `00` | Tail Right |
| `01` | Tail Left |
| `16` | Tail Up |
| `17` | Tail Down |
| `32` | Body Vertical |
| `33` | Body Horizontal |
| `02` | Turn Bottom-Right |
| `03` | Turn Bottom-Left |
| `18` | Turn Top-Right |
| `19` | Turn Top-Left |
| `34` | Head Right |
| `35` | Head Left |
| `50` | Head Up |
| `51` | Head Down |

### 🐍 ENEMY SNAKE TILES
- Same logic as player.
- Offset by `48` tiles (3 rows) from player tiles.
- Starts at index `48` (effectively).

### 🧱 WALL TILES

| Tile ID | Description |
|---|---|
| `96` | Wall Right (Vertical face) |
| `97` | Wall Left (Vertical face) |
| `112` | Wall Up (Horizontal face) |
| `113` | Wall Down (Horizontal face) |
| `98` | Corner Bottom-Right |
| `99` | Corner Bottom-Left |
| `114` | Corner Top-Right |
| `115` | Corner Top-Left |

### 🍎 FOOD TILES
Indices: `100`, `101`, `102`, `103` (Non-directional)

### 🌀 PORTAL TILES
Index: `116` (Visual only)

---

## 6. Rotation System (UPDATED)

⚠️ **NO RUNTIME ROTATION**  
- Tiles are drawn **as-is** from the atlas.
- `ctx.rotate()` is NOT used for orientation.
- Code selects the correct tile ID based on:
  - Movement direction (Head)
  - Neighbor connectivity (Body, Walls)
  - Previous segment direction (Tail)

---

## 7. Wall Rotation Rules

Walls are NOT random blocks.  
They are connected paths.

### Straight Wall (`13`)
- Vertical → 0°
- Horizontal → 90°

### Turn Wall (`14`)
Rotation based on neighbors:
- Right + Down → 0°
- Down + Left → 90°
- Left + Up → 180°
- Up + Right → 270°

No isolated wall tiles allowed.

---

## 8. Core Gameplay Systems

### Snake
- Moves one tile per tick
- Has energy
- Moving drains energy
- Turning drains extra energy
- Eating food:
  - restores energy
  - increases length
- Death occurs if:
  - energy reaches zero (starvation)
  - collision with wall or enemy

---

### Predators (Enemy Snakes)

Predators are enemy snakes (not random creatures).

Rules:
- Use the SAME grid and rotation logic as player snake
- Compete for food
- Can grow
- Become more aggressive as difficulty increases
- Collision with player snake causes death

Predator AI should be rule-based (not ML):
- roam
- seek food
- chase player when nearby

Predators can eat food.
Food is a shared resource between player and predators.
Predators that eat food gain energy and may grow.
Food spawn logic must ensure the player is never completely starved unfairly.

---

## 9. Food System

- Food spawns only on reachable, valid tiles
- Never spawn inside:
  - walls
  - snakes
  - portals
- Spawn rate adapts to difficulty
- Different food indices may give different energy values

---

## 10. Portal System

- Portal tile (`25`) acts as teleport
- Portals always exist in pairs
- Entering a portal instantly exits at its pair
- Direction and momentum preserved
- Portals must never spawn inside walls
- Portal exits must always be reachable

---

## 11. Procedural Level Generation (MANDATORY)

Levels MUST ALWAYS be solvable.

### Generation Rules
- Use predefined wall patterns:
  - zig-zags
  - corridors
  - spirals
- Never fully enclose regions
- Never trap the player at spawn
- Never generate unreachable tiles

### Solvability Check (Required)
After generation:
- Treat grid as a graph
- Run connectivity check (flood-fill / BFS)
- If any open tile is unreachable → regenerate level

Impossible levels are NOT allowed.

---

## 12. Adaptive Difficulty System

Difficulty increases gradually based on:
- time survived
- snake length
- food efficiency

Difficulty affects:
- wall density
- wall pattern complexity
- predator count and behavior
- food scarcity
- energy drain rate

Difficulty must be smooth, not spiky.

---

## 13. Controls

- WASD
- Arrow keys
- Optional pause key
- Fullscreen toggle

No mouse required.

---

## 14. Game Flow

1. Game starts
2. Procedural level generated
3. Player survives as long as possible
4. On death:
   - prompt player to enter name
   - submit score to backend
5. Display leaderboard

---

## 15. Backend Responsibilities

Backend ONLY handles:
- player name
- score
- time survived
- max snake length
- difficulty reached

GraphQL endpoints:
- submitScore
- getLeaderboard

Backend does NOT control gameplay.

---

## 16. Non-Negotiable Constraints

- Do NOT create additional sprite sheets
- Do NOT create rotated art assets
- Do NOT break grid alignment
- Do NOT generate impossible levels
- Do NOT create extra documentation files
- ALL documentation must stay in THIS README.md

---

## 17. Final Objective

Deliver a **playable, clean, modular game** that:
- uses one sprite atlas
- rotates tiles in code
- generates fair procedural levels
- scales difficulty intelligently
- is easy to extend later

---

## 18. Setup Instructions

### Prerequisites
- Node.js (for serving the frontend, optional)
- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+

### Frontend Setup
1. Open `index.html` in a web browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server -p 8000
   ```
2. Navigate to `http://localhost:8000` in your browser

### Backend Setup
1. **Install PostgreSQL** and create a database:
   ```sql
   CREATE DATABASE bitesurvive;
   ```

2. **Update database credentials** in `backend/src/main/resources/application.properties`:
   ```properties
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Build and run the backend**:
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```

4. The backend will be available at `http://localhost:8080`
   - GraphQL endpoint: `http://localhost:8080/graphql`

### Running the Game
1. Start the backend server (see Backend Setup)
2. Open the frontend in a browser (see Frontend Setup)
3. Click "Start Game" and play!

### Troubleshooting
- **Assets not loading**: Ensure `assets/all_stuff.png` exists in the project root
- **Backend connection errors**: Verify PostgreSQL is running and credentials are correct
- **CORS errors**: The backend is configured to allow CORS from common development ports

