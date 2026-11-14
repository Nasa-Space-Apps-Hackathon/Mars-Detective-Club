"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LoadingScreen.module.css";
import { MachineIcon, ZiggySvg } from "./primitives";

// Keep the dynamic-import fallback and the mounted game's loader moving forward.
let bootProgress = 0;

interface LoadingScreenProps {
  progress?: number;
  ready?: boolean;
  message?: string;
  error?: boolean;
  onComplete?: () => void;
}

/* Deterministic star field and dust (no Math.random, so server and client markup match). */
const rng = (() => {
  let seed = 1976;
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
})();
const STARS = Array.from({ length: 90 }, () => ({ x: rng() * 1600, y: rng() * 420, r: 0.8 + rng() * 2, o: 0.4 + rng() * 0.6 }));
const DUST = Array.from({ length: 22 }, () => ({ x: rng() * 1600, y: 520 + rng() * 360, r: 1.5 + rng() * 3, d: 6 + rng() * 9, w: -rng() * 12 }));

const TIPS = [
  "Follow the glowing beams to find each NASA machine.",
  "Hold E next to a machine to scan it.",
  "Press J to open your Detective Journal.",
  "Collect three Evidence Cards to solve the case.",
  "Hold Shift to run. Press Space to jump.",
];

const LENS = { x: 930, y: 400, r: 150 };

/** Machines on the far ridges, each under its beam. Uses the game's own icons. */
function Beacon({ id, x, y, size }: { id: "viking1" | "opportunity" | "phoenix"; x: number; y: number; size: number }) {
  return (
    <g>
      <rect className={styles.beam} x={x - size * 0.17} y={y - 330} width={size * 0.34} height={330} fill="url(#ls-beam)" />
      <ellipse cx={x} cy={y + 2} rx={size * 0.62} ry={size * 0.1} fill="#2a0f14" opacity="0.4" />
      <g transform={`translate(${x - size / 2} ${y - size * 0.92})`}>
        <MachineIcon id={id} size={size} />
      </g>
    </g>
  );
}

/**
 * Mars at sunset, drawn in code. Captain Pebble lifts a magnifying glass,
 * and through the lens the dry crater is full of water: the question of the case.
 */
function Scene() {
  return (
    <svg className={styles.scene} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141433" />
          <stop offset="0.3" stopColor="#3a1f5a" />
          <stop offset="0.52" stopColor="#a8324a" />
          <stop offset="0.68" stopColor="#f0703a" />
          <stop offset="0.78" stopColor="#ffc46b" />
        </linearGradient>
        <radialGradient id="ls-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.12" stopColor="#e6f6ff" />
          <stop offset="0.35" stopColor="#7cc4ff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#7cc4ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ls-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff4d6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff4d6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ls-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9743a" />
          <stop offset="1" stopColor="#8f3a1c" />
        </linearGradient>
        <linearGradient id="ls-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1420" stopOpacity="0" />
          <stop offset="0.7" stopColor="#2a1420" stopOpacity="0.8" />
          <stop offset="1" stopColor="#2a1420" />
        </linearGradient>
        <linearGradient id="ls-old-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#58b8ff" />
          <stop offset="1" stopColor="#ffe6b8" />
        </linearGradient>
        <linearGradient id="ls-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fc3ff" />
          <stop offset="1" stopColor="#1668d6" />
        </linearGradient>
        <linearGradient id="ls-streak" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <clipPath id="ls-lens">
          <circle cx={LENS.x} cy={LENS.y} r={LENS.r} />
        </clipPath>
      </defs>

      <rect width="1600" height="900" fill="url(#ls-sky)" />
      {STARS.map((st, i) => (
        <circle key={i} className={i % 4 === 0 ? styles.twinkle : undefined} style={{ animationDelay: `${(i % 7) * -0.4}s` }} cx={st.x} cy={st.y} r={st.r} fill="#fff6e8" opacity={st.o * (1 - st.y / 470)} />
      ))}
      <g className={styles.shooting}>
        <rect x="0" y="0" width="150" height="3" rx="1.5" fill="url(#ls-streak)" />
      </g>
      {/* Phobos and Deimos */}
      <circle cx="1440" cy="110" r="20" fill="#e2cbb8" />
      <circle cx="1432" cy="104" r="5" fill="#c4a995" />
      <circle cx="1448" cy="118" r="3" fill="#c4a995" />
      <circle cx="1310" cy="70" r="8" fill="#eedfd2" />
      {/* the blue Martian sunset */}
      <circle className={styles.sunGlow} cx="470" cy="610" r="300" fill="url(#ls-sun)" />
      <circle cx="470" cy="610" r="30" fill="#ffffff" />

      {/* far mesas */}
      <polygon points="0,612 80,560 190,572 270,520 400,530 500,590 680,574 780,524 900,532 990,580 1160,566 1280,512 1410,520 1500,566 1600,548 1600,720 0,720" fill="#5a2140" />
      <polygon points="270,520 400,530 372,560 250,560" fill="#8c3350" />
      <polygon points="780,524 900,532 880,562 760,560" fill="#8c3350" />
      <polygon points="1280,512 1410,520 1392,552 1262,552" fill="#8c3350" />

      {/* middle ridges where the machines rest */}
      <polygon points="0,676 150,640 320,634 470,662 640,668 800,632 960,628 1100,660 1260,648 1400,622 1520,630 1600,648 1600,790 0,790" fill="#a03c26" />
      <polygon points="0,676 150,640 320,634 470,662 640,668 800,632 960,628 1100,660 1260,648 1400,622 1520,630 1600,648 1600,656 1520,640 1400,632 1260,658 1100,670 960,638 800,642 640,678 470,672 320,644 150,650 0,686" fill="#ffb068" opacity="0.75" />
      <Beacon id="viking1" x={200} y={642} size={84} />
      <Beacon id="opportunity" x={470} y={664} size={78} />
      <Beacon id="phoenix" x={700} y={660} size={74} />

      {/* near ground, low-poly facets */}
      <polygon points="0,748 200,720 430,734 620,712 860,730 1080,708 1320,726 1600,708 1600,900 0,900" fill="url(#ls-ground)" />
      <polygon points="200,720 430,734 360,808 140,798" fill="#f09a5c" opacity="0.5" />
      <polygon points="620,712 860,730 800,820 560,798" fill="#f09a5c" opacity="0.38" />
      <polygon points="1080,708 1320,726 1280,808 1040,798" fill="#f09a5c" opacity="0.45" />
      {/* the dry crater the lens is pointed at */}
      <ellipse cx="930" cy="770" rx="150" ry="24" fill="#6e2c16" opacity="0.6" />
      <ellipse cx="930" cy="765" rx="150" ry="20" fill="none" stroke="#f3b074" strokeWidth="4" opacity="0.6" />
      <polygon points="1470,812 1506,778 1552,790 1566,826 1516,840" fill="#5e2716" />
      <polygon points="1506,778 1552,790 1524,808" fill="#8a3f22" />
      <polygon points="60,812 96,782 138,790 152,822 104,836" fill="#5e2716" />

      {DUST.map((m, i) => (
        <circle key={i} className={styles.dust} style={{ animationDuration: `${m.d}s`, animationDelay: `${m.w}s` }} cx={m.x} cy={m.y} r={m.r} fill="#ffd9a8" opacity="0.5" />
      ))}
      <rect x="0" y="640" width="1600" height="260" fill="url(#ls-shade)" />

      {/* a soft cone of light from the lens down to the crater */}
      <polygon points="800,470 1060,470 1076,770 784,770" fill="#7cc4ff" opacity="0.1" />

      {/* through the lens: the same place, long ago, with water */}
      <g clipPath="url(#ls-lens)">
        <rect x="760" y="230" width="340" height="340" fill="url(#ls-old-sky)" />
        <circle cx="1010" cy="318" r="24" fill="#fffbe6" />
        <polygon points="760,420 820,372 880,392 930,350 990,384 1040,362 1100,400 1100,470 760,470" fill="#b8562e" />
        <polygon points="930,350 990,384 950,410 900,396" fill="#d9743a" />
        <rect x="760" y="436" width="340" height="140" fill="url(#ls-water)" />
        <g className={styles.waves} stroke="#d6f1ff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.85">
          <path d="M700 462 q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" />
          <path d="M680 496 q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" opacity="0.7" />
          <path d="M700 530 q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" opacity="0.5" />
        </g>
        <path className={styles.twinkle} d="M860 476 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 l12 -5z" fill="#ffffff" />
        <path className={styles.twinkle} style={{ animationDelay: "-1.2s" }} d="M1000 508 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4z" fill="#ffffff" />
        <path d="M800 300 A150 150 0 0 1 900 258" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.45" />
      </g>
      <circle className={styles.lensGlow} cx={LENS.x} cy={LENS.y} r={LENS.r + 26} fill="none" stroke="#7cc4ff" strokeWidth="18" opacity="0.25" />
      <circle cx={LENS.x} cy={LENS.y} r={LENS.r} fill="none" stroke="#7a4a12" strokeWidth="26" />
      <circle cx={LENS.x} cy={LENS.y} r={LENS.r} fill="none" stroke="#ffd166" strokeWidth="18" />
      <circle cx={LENS.x} cy={LENS.y} r={LENS.r - 9} fill="none" stroke="#fff3c4" strokeWidth="3" opacity="0.7" />

      {/* arm, handle and glove */}
      <line x1="1034" y1="532" x2="1082" y2="592" stroke="#5a3214" strokeWidth="24" strokeLinecap="round" />
      <line x1="1036" y1="535" x2="1080" y2="589" stroke="#8a5424" strokeWidth="12" strokeLinecap="round" />
      <path d="M1172 700 L1084 596" stroke="#ff8a3d" strokeWidth="52" strokeLinecap="round" />
      <path d="M1172 700 L1084 596" stroke="#ffb070" strokeWidth="10" strokeLinecap="round" opacity="0.5" transform="translate(-12 -6)" />
      <circle cx="1080" cy="590" r="30" fill="#fbf9f5" stroke="#c9ced9" strokeWidth="4" />

      {/* Captain Pebble */}
      <g transform="translate(1250 990) scale(1.55)">
        <rect x="-70" y="-214" width="140" height="106" rx="20" fill="#e9e4dc" />
        <line x1="50" y1="-212" x2="50" y2="-270" stroke="#9aa0ad" strokeWidth="5" />
        <circle className={styles.blink} cx="50" cy="-274" r="8" fill="#ff4d4d" />
        <rect x="-40" y="-98" width="32" height="84" rx="14" fill="#f4f1ec" />
        <rect x="8" y="-98" width="32" height="84" rx="14" fill="#f4f1ec" />
        <rect x="54" y="-196" width="32" height="92" rx="16" fill="#f07a2e" transform="rotate(-8 70 -196)" />
        <circle cx="80" cy="-100" r="18" fill="#f4f1ec" />
        <rect x="-56" y="-208" width="112" height="124" rx="40" fill="#ff8a3d" />
        <rect x="-26" y="-172" width="52" height="38" rx="8" fill="#f4f1ec" />
        <circle cx="12" cy="-153" r="7" fill="#5ce1e6" />
        <rect x="-18" y="-159" width="18" height="6" rx="3" fill="#c9ced9" />
        <circle cx="0" cy="-254" r="64" fill="#fbf9f5" stroke="#c9ced9" strokeWidth="4" />
        <ellipse cx="-4" cy="-250" rx="46" ry="38" fill="#141433" />
        {/* the lens and the sunset reflected in the visor */}
        <circle cx="-22" cy="-252" r="15" fill="#4fc3ff" opacity="0.85" />
        <circle cx="-22" cy="-252" r="15" fill="none" stroke="#ffd166" strokeWidth="3" />
        <path d="M-44 -236 Q-4 -214 36 -236 Q18 -214 -4 -212 Q-26 -214 -44 -236Z" fill="#f0703a" opacity="0.6" />
        <ellipse cx="14" cy="-270" rx="12" ry="6" fill="#ffffff" opacity="0.5" />
      </g>

      {/* Ziggy hovering above, looking on */}
      <g transform="translate(1085 150)">
        <g className={styles.bob}>
          <ZiggySvg size={175} />
        </g>
      </g>
    </svg>
  );
}

/** Loading screen: code-drawn Mars scene, title, a rover riding the progress bar, and play tips. */
export default function LoadingScreen({ progress = 0, ready = false, message = "Preparing your mission", error = false, onComplete }: LoadingScreenProps) {
  const [displayed, setDisplayed] = useState(() => Math.min(bootProgress, 94));
  const current = useRef(displayed);
  const latest = useRef({ progress, ready, error, onComplete });
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTip((value) => (value + 1) % TIPS.length), 3600);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => { latest.current = { progress, ready, error, onComplete }; }, [progress, ready, error, onComplete]);

  useEffect(() => {
    const started = performance.now();
    let previous = started;
    let completedAt = 0;
    let frame = 0;
    const tick = (time: number) => {
      const state = latest.current;
      const dt = Math.min(time - previous, 64);
      previous = time;
      // A small buffer covers JavaScript/WASM setup, which has no byte progress.
      const buffer = Math.min(28, 4 + (time - started) / 180);
      const target = state.ready && !state.error ? 100 : Math.min(94, Math.max(buffer, state.progress));
      if (!state.error) {
        current.current = Math.max(current.current, Math.min(target, current.current + Math.max(0.015, (target - current.current) * 0.006) * dt));
        if (state.ready && current.current > 99.5) current.current = 100;
      }
      bootProgress = current.current;
      const rounded = Math.floor(current.current);
      setDisplayed((value) => value === rounded ? value : rounded);
      if (rounded === 100) {
        if (!completedAt) completedAt = time;
        if (time - completedAt >= 240) {
          latest.current.onComplete?.();
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const roverAt = Math.min(97, Math.max(3, displayed));
  return (
    <div className={styles.screen} data-loading-screen="true" aria-busy={displayed < 100}>
      <div className={styles.composition}>
        <Scene />
      </div>

      <header className={styles.titleBlock}>
        <span className={styles.stamp}>Case #001</span>
        <h1 id="loading-title" className={styles.title}>
          <span className={styles.small}>The Great</span>
          <span className={styles.big}>Mars</span>
          <span className={styles.mid}>Detective Club</span>
        </h1>
        <p className={styles.question}>Did Mars ever have water?</p>
      </header>

      <section className={styles.loader} aria-labelledby="loading-title">
        <div className={styles.caption}>
          <p role="status" aria-live="polite">{error ? "Landing delayed. An asset could not load." : displayed === 100 ? "Ready to explore Mars" : message}</p>
          <span className={styles.percentage} aria-hidden="true">{displayed}%</span>
        </div>
        <div className={styles.trackWrap}>
          <div className={styles.rover} style={{ left: `${roverAt}%` }} aria-hidden="true">
            <MachineIcon id="opportunity" size={52} />
          </div>
          <div className={styles.track} role="progressbar" aria-label="Preparing Mars" aria-valuemin={0} aria-valuemax={100} aria-valuenow={displayed}>
            <div className={styles.fill} style={{ transform: `scaleX(${displayed / 100})` }} />
          </div>
        </div>
        {error ? (
          <button className={styles.retry} onClick={() => window.location.reload()}>Retry landing</button>
        ) : (
          <p key={tip} className={styles.tip}><b>Tip:</b> {TIPS[tip]}</p>
        )}
      </section>
    </div>
  );
}
