# 🔎 The Great Mars Detective Club

**NASA Space Apps Challenge 2026** · *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*

Case #001: *Did Mars ever have water?* Kids (9–14) play Captain Pebble with the robot sidekick Ziggy. They visit three real NASA machines on Mars (**Viking 1**, **Opportunity**, **Phoenix**), solve a mini science activity at each, collect 3 Evidence Cards, and solve the case on a timeline board.

**Live demo:** https://mars-detective-club.from-masr.com · **Source:** https://github.com/Nasa-Space-Apps-Hackathon/Mars-Detective-Club

**Fact-check log and credits:** [SOURCES.md](SOURCES.md)

**Stack:** Next.js 15 · TypeScript · React Three Fiber · Zustand · Tailwind v4 · motion

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
# open http://localhost:3000/?dev=1 for the Dev Panel (jump to any phase / fake scans)
npm run build        # static export → /out (plain static files, host anywhere)
```

> Windows + PowerShell blocks `npm.ps1`? Type `npm.cmd` instead of `npm`, or use **Command Prompt (cmd)**.

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
    Rocks.tsx            1,100 instanced rocks with shared Rapier colliders
    Sky.tsx              Butterscotch Mars sky, sun, Phobos & Deimos
    Dust.tsx             Floating dust (legacy dust devil is not mounted)
    Landmarks.tsx        Landing pod with club flag, signpost
    Player.tsx           Rapier character controller: walk/run/jump and wind forces
    Character.tsx        Articulated Pebble, scan gesture and following Ziggy
    CameraRig.tsx        Drei OrbitControls, follow, zoom and steady camera option
    Environment.tsx      Cloud layers and three interactive dust devils
    Footprints.tsx       Boot prints in the dust
    controls.ts          Legacy input helpers; current player/camera handle input
    playerState.ts       Live player position, colliders, dev teleport
  artifacts/
    StubArtifacts.tsx    NASA Viking/Opportunity models + placeholder Phoenix · Person 2
  ui/                    Everything 2D (HUD, dialogue, files, cards…)      · Person 4 ✅
    activities/          SoilLab (Viking), RockScanner (Opportunity), DigSite (Phoenix)
  content/               All text + facts as JSON                          · Person 3
```

---

## 🎮 Controls

`W/A/S/D` or arrows: move relative to the camera · `Shift`: sprint · `Space`: jump (original Mars gravity) · mouse drag: orbit 360° / tilt camera · scroll: zoom · `R`: recenter · `E`: scan · `J`: journal · `Esc`: pause

Exploration preserves the original Mars gravity (3.71 m/s²) and jump impulse (3.4 m/s). Dust-devil forces are exaggerated for this playful simulation: they pull, lift and toss Pebble, with an automatic recovery; landing zones and mission pads are sheltered. The camera button in the HUD reduces shake and speed effects and also respects the system's reduced-motion preference.

Viking 1 and Opportunity now load local NASA GLB models using Drei. Model sources, credits and the remaining Phoenix asset gap are documented in [public/models/README.md](public/models/README.md). Draco decoding files are hosted locally. Phoenix is still a stylized representation.

---

## 🤝 Integration guide

### The map (Person 1) ✅
- Spawn at the landing pod (south) → **Viking 1** (west plains, ~95 m) → **Opportunity** (inside a small "Eagle" crater, east, ~130 m) → **Phoenix** (icy polar north, ~110 m).
- `getHeight(x, z)` from `world/terrainData.ts` returns the ground height anywhere. **Always use it** to place things on the ground.
- Change machine positions only in `world/zones.ts` (the terrain flattens a pad under each one automatically).

### Machines, scan and Ziggy (Person 2)
`artifacts/StubArtifacts.tsx` renders the machines, including local NASA models. The upgraded `world/Player.tsx` owns grounded proximity and scan input; `world/Character.tsx` owns Pebble's scan gesture and Ziggy.

| Must do | How |
|---|---|
| Place each machine at `ZONES[id]`, on the ground | `const y = getHeight(x, z)` |
| Tell the UI which machine is in range | Already handled by `world/Player.tsx` while grounded |
| Start the scan on **E** | Already handled by `world/Player.tsx`; HUD buttons use the same store action |
| Block the player from walking through machines | Fixed Rapier shapes live in `world/WorldColliders.tsx`; update them when changing model dimensions |

Read the player's live position inside `useFrame` from `playerState` (`x, y, z, yaw, speed, grounded`), e.g. to make Ziggy follow.

### UI (Person 4) ✅
Everything after `startScan(id)` is handled by the UI: dialogue → case file → activity → Evidence Card → back to `explore`. After 3/3 cards → case board ending → credits.

**Phases:** `menu → intro → explore ⇄ (dialogue → memory → activity → evidence) → ending → credits`. The player can only move while `canMove()` is true.

### Dev tools
Open `?dev=1`: jump to any phase, fake a scan, open an activity, unlock evidence, or **tp** (teleport next to a machine).

---

## Content rules (Person 3)

- Every fact in `src/content/*.json` has been checked against NASA and JPL pages. The log is in [SOURCES.md](SOURCES.md). Re-check and update the log if you change a fact.
- Dialogue keys: `intro`, `<id>_intro`, `<id>_outro`, `case_ready`. Speakers: `ziggy`, `pebble`, `narrator`.
- To add a real NASA photo: put it in `public/images/` and set `"image": "/images/viking1.jpg"` + `"imageCredit"`. Otherwise an illustration is shown.

## Before submission

- [x] Team names + GitHub URL in `src/ui/Credits.tsx`
- [ ] AI-use disclosure filled in `src/ui/Credits.tsx` (Space Apps rule)
- [x] All facts verified (Person 3), logged in `SOURCES.md`
- [x] Live link in this README
- [ ] Music and sound-effect credits with licenses
- [ ] Demo video and slides
