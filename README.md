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
  app/                 Next.js entry (page loads <Game/> client-side)
  components/Game.tsx  Root: 3D world + UI overlay                    · Person 5
  store/
    types.ts           SHARED CONTRACTS (ArtifactId, Phase, content types)
    useGame.ts         The one game store (phases, progression)        · Person 5 + 4
  world/
    zones.ts           Machine positions + scan radius                 · Person 1
    StubWorld.tsx      ⚠️ PLACEHOLDER 3D scene → replace              · Person 1 + 2
  ui/                  Everything 2D (HUD, dialogue, files, cards…)    · Person 4 ✅
    activities/        SoilLab (Viking), RockScanner (Opportunity), DigSite (Phoenix)
  content/             All text + facts as JSON                        · Person 3
    artifacts.json     Machine facts + NASA sources + Evidence Cards
    dialogue.json      All Ziggy/Pebble lines
    activities.json    Activity data (rocks, experiments, answers)
  lib/                 content loaders, objectives, synthesized sfx
```

---

## 🤝 Integration guide (read this before replacing StubWorld)

The UI only talks to the 3D world through the store in `src/store/useGame.ts`:

| Who | Must do | API |
|---|---|---|
| **Person 1** (world) | Only move the player when allowed | `canMove()` → boolean |
| **Person 1** | Report player position + heading ~10×/sec (HUD compass) | `useGame.getState().setPlayer([x, z], yaw)`, where forward = `(sin yaw, cos yaw)` |
| **Person 1** | Put the real machine positions in `ZONES` | `src/world/zones.ts` |
| **Person 2** (artifacts) | Tell the UI which machine is in range (or `null`) | `setNearArtifact(id \| null)` |
| **Person 2** | When the player presses **E** near a machine | `startScan(id)` |
| **Person 3** (content) | Edit only the JSON files, keep the keys | `src/content/*.json` |

Everything after `startScan(id)` is handled by the UI: dialogue → case file → activity → Evidence Card → back to `explore`. After 3/3 cards → case board ending → credits.

**Phases:** `menu → intro → explore ⇄ (dialogue → memory → activity → evidence) → ending → credits`

The easiest way to integrate: copy what `StubWorld.tsx` does with the store (keyboard **E** handler, proximity loop, `setPlayer`) into your real components, then delete `StubWorld.tsx` and render your world in `components/Game.tsx`.

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
