# 🔎 The Great Mars Detective Club

**NASA Space Apps Challenge 2026** · *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*

Case #001: *Did Mars ever have water?* Kids (9–14) play Captain Pebble with the robot sidekick Ziggy. They visit three real NASA machines on Mars (**Viking 1**, **Opportunity**, **Phoenix**), solve a mini science activity at each, collect 3 Evidence Cards, and solve the case on a timeline board.

**Live demo:** _TODO (Vercel URL)_ · **Stack:** Next.js 15 · TypeScript · React Three Fiber · Zustand · Tailwind v4 · motion

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
# open http://localhost:3000/?dev=1 for the Dev Panel (jump to any phase / fake scans)
npm run build        # static export → /out (deploys to Vercel as-is)
```

> Windows + PowerShell blocks `npm.ps1`? Use **Command Prompt (cmd)** instead.

---

## Project structure: who owns what

```
src/
  app/                   Next.js entry (page loads <Game/> client-side)
  components/Game.tsx    Root: <MarsWorld> + <StubArtifacts> + <UILayer>   · Person 5
  store/
    types.ts             SHARED CONTRACTS (ArtifactId, Phase, content types)
    useGame.ts           The one game store (phases, progression)          · Person 5 + 4
  world/                 THE MARS WORLD                                     · Person 1 ✅
    MarsWorld.tsx        Canvas, lights, fog: puts everything together
    zones.ts             Map layout: machine positions, spawn, map size
    terrainData.ts       getHeight(x,z), craters, polar frost, ground colors
    Terrain.tsx          Low-poly terrain mesh
    Rocks.tsx            260 instanced rocks (big ones block the player)
    Sky.tsx              Butterscotch Mars sky, sun, Phobos & Deimos
    Dust.tsx             Floating dust + a wandering dust devil
    Landmarks.tsx        Landing pod with club flag, signpost
    Player.tsx           Captain Pebble: walk/run/jump (Mars gravity), camera
    Footprints.tsx       Boot prints in the dust
    controls.ts          Keyboard + mouse input
    playerState.ts       Live player position, colliders, dev teleport
  artifacts/
    StubArtifacts.tsx    ⚠️ PLACEHOLDER machines + scan + Ziggy → replace     · Person 2
  ui/                    Everything 2D (HUD, dialogue, files, cards…)      · Person 4 ✅
    activities/          SoilLab (Viking), RockScanner (Opportunity), DigSite (Phoenix)
  content/               All text + facts as JSON                          · Person 3
```

---

## 🎮 Controls

`W/A/S/D` or arrows: walk and turn · `Shift`: run · `Space`: jump (Mars gravity, 38% of Earth's) · mouse drag: turn / tilt camera · scroll: zoom · `E`: scan · `J`: journal · `Esc`: pause

---

## 🤝 Integration guide

### The map (Person 1) ✅
- Spawn at the landing pod (south) → **Viking 1** (west plains, ~95 m) → **Opportunity** (inside a small "Eagle" crater, east, ~130 m) → **Phoenix** (icy polar north, ~110 m).
- `getHeight(x, z)` from `world/terrainData.ts` returns the ground height anywhere. **Always use it** to place things on the ground.
- Change machine positions only in `world/zones.ts` (the terrain flattens a pad under each one automatically).

### Machines, scan and Ziggy (Person 2): replace `artifacts/StubArtifacts.tsx`
Keep these four things when you swap in real models:

| Must do | How |
|---|---|
| Place each machine at `ZONES[id]`, on the ground | `const y = getHeight(x, z)` |
| Tell the UI which machine is in range (every frame) | `useGame.getState().setNearArtifact(id \| null)` |
| Start the scan on **E** | `if (nearArtifact && canMove()) startScan(id)` |
| Block the player from walking through machines | `addColliders([{ x, z, r }])` in a `useEffect` (it returns a cleanup) |

Read the player's live position inside `useFrame` from `playerState` (`x, y, z, yaw, speed, grounded`), e.g. to make Ziggy follow.

### UI (Person 4) ✅
Everything after `startScan(id)` is handled by the UI: dialogue → case file → activity → Evidence Card → back to `explore`. After 3/3 cards → case board ending → credits.

**Phases:** `menu → intro → explore ⇄ (dialogue → memory → activity → evidence) → ending → credits`. The player can only move while `canMove()` is true.

### Dev tools
Open `?dev=1`: jump to any phase, fake a scan, open an activity, unlock evidence, or **tp** (teleport next to a machine).

---

## Content rules (Person 3)

- `artifacts.json` and `dialogue.json` are **drafts**. Every fact must be checked against the listed NASA source before submission.
- Dialogue keys: `intro`, `<id>_intro`, `<id>_outro`, `case_ready`. Speakers: `ziggy`, `pebble`, `narrator`.
- To add a real NASA photo: put it in `public/images/` and set `"image": "/images/viking1.jpg"` + `"imageCredit"`. Otherwise an illustration is shown.

## Before submission

- [ ] Team names + GitHub URL in `src/ui/Credits.tsx`
- [ ] AI-use disclosure filled in `src/ui/Credits.tsx` (Space Apps rule)
- [ ] All facts verified (Person 3)
- [ ] Live Vercel link in this README
