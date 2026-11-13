"use client";

import { motion } from "motion/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { sfx } from "@/lib/sfx";
import type { ArtifactId, Speaker } from "@/store/types";

/* ───────── Button ───────── */
type Variant = "primary" | "ghost" | "glow" | "paper";
const variants: Record<Variant, string> = {
  primary: "bg-rust hover:bg-[#d8521a] text-white border-b-4 border-rust-dark",
  glow: "bg-glow hover:bg-[#7eeef2] text-night border-b-4 border-[#2aa6ab]",
  ghost: "bg-white/10 hover:bg-white/20 text-white border border-white/25",
  paper: "bg-[#3b2414] hover:bg-[#5a3820] text-paper border-b-4 border-black/40",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      onClick={(e) => {
        sfx.click();
        onClick?.(e);
      }}
      className={`font-display font-semibold rounded-2xl px-6 py-3 text-lg transition active:translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ───────── Panel ───────── */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl pointer-events-auto ${className}`}>{children}</div>;
}

/* ───────── Full-screen modal backdrop ───────── */
export function Overlay({ children, dim = true }: { children: ReactNode; dim?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`absolute inset-0 grid place-items-center p-4 pointer-events-auto ${dim ? "bg-night/55" : ""}`}
    >
      {children}
    </motion.div>
  );
}

export const popIn = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
  transition: { type: "spring" as const, stiffness: 260, damping: 22 },
};

/* ───────── Character portraits (original designs) ───────── */
export function ZiggySvg({ size = 96, talking = false }: { size?: number; talking?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Ziggy the robot">
      <g className={talking ? "origin-center animate-bounce" : ""} style={{ animationDuration: "0.6s" }}>
        <rect x="18" y="10" width="64" height="5" rx="2.5" fill="#ff8a3d" />
        <rect x="47" y="14" width="6" height="10" fill="#c9ced9" />
        <circle cx="50" cy="56" r="30" fill="#f4f6fb" stroke="#c9ced9" strokeWidth="3" />
        <rect x="28" y="42" width="44" height="24" rx="12" fill="#1b1f3b" />
        <circle cx="41" cy="54" r="5" fill="#5ce1e6" />
        <circle cx="59" cy="54" r="5" fill="#5ce1e6" />
        <path d={talking ? "M42 74 Q50 82 58 74" : "M43 75 Q50 79 57 75"} stroke="#1b1f3b" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="22" cy="58" r="5" fill="#ff8a3d" />
        <circle cx="78" cy="58" r="5" fill="#ff8a3d" />
      </g>
    </svg>
  );
}

export function PebbleSvg({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Captain Pebble">
      <circle cx="50" cy="48" r="32" fill="#ffffff" stroke="#c9ced9" strokeWidth="3" />
      <ellipse cx="50" cy="50" rx="22" ry="18" fill="#5ce1e6" />
      <ellipse cx="42" cy="44" rx="6" ry="4" fill="#ffffff" opacity="0.7" />
      <circle cx="43" cy="51" r="3" fill="#1b1f3b" />
      <circle cx="57" cy="51" r="3" fill="#1b1f3b" />
      <path d="M44 59 Q50 63 56 59" stroke="#1b1f3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="30" y="80" width="40" height="14" rx="7" fill="#ff8a3d" />
      <circle cx="50" cy="87" r="4" fill="#ffd166" />
    </svg>
  );
}

export function NarratorIcon({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Mars Detective Club">
      <circle cx="50" cy="50" r="40" fill="#c1440e" stroke="#ffd166" strokeWidth="4" />
      <circle cx="44" cy="44" r="16" fill="none" stroke="#fff" strokeWidth="6" />
      <line x1="56" y1="56" x2="70" y2="70" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export function Portrait({ speaker, talking, size }: { speaker: Speaker; talking?: boolean; size?: number }) {
  if (speaker === "ziggy") return <ZiggySvg size={size} talking={talking} />;
  if (speaker === "pebble") return <PebbleSvg size={size} />;
  return <NarratorIcon size={size} />;
}

export const SPEAKER_NAME: Record<Speaker, string> = {
  ziggy: "Ziggy",
  pebble: "Captain Pebble",
  narrator: "Mission Control",
};

/* ───────── Machine icons ───────── */
export function MachineIcon({ id, size = 64 }: { id: ArtifactId; size?: number }) {
  const s = { width: size, height: size, viewBox: "0 0 100 100" };
  if (id === "viking1")
    return (
      <svg {...s} aria-label="Viking 1 lander">
        <line x1="30" y1="62" x2="18" y2="88" stroke="#d6a43a" strokeWidth="5" />
        <line x1="70" y1="62" x2="82" y2="88" stroke="#d6a43a" strokeWidth="5" />
        <line x1="50" y1="64" x2="50" y2="90" stroke="#d6a43a" strokeWidth="5" />
        <polygon points="25,48 40,38 60,38 75,48 75,62 25,62" fill="#e7e2da" stroke="#8a8f9e" strokeWidth="3" />
        <line x1="58" y1="38" x2="64" y2="20" stroke="#8a8f9e" strokeWidth="3" />
        <path d="M52 22 Q64 8 78 20 Z" fill="#fff" stroke="#8a8f9e" strokeWidth="3" />
      </svg>
    );
  if (id === "opportunity")
    return (
      <svg {...s} aria-label="Opportunity rover">
        <rect x="10" y="40" width="80" height="8" rx="2" fill="#2b3f75" stroke="#5ce1e6" strokeWidth="2" />
        <rect x="32" y="48" width="36" height="16" fill="#d6a43a" />
        <line x1="62" y1="40" x2="62" y2="18" stroke="#8a8f9e" strokeWidth="4" />
        <rect x="54" y="12" width="18" height="9" rx="2" fill="#e7e2da" />
        {[24, 50, 76].map((x) => (
          <circle key={x} cx={x} cy="76" r="9" fill="#444" stroke="#888" strokeWidth="3" />
        ))}
      </svg>
    );
  return (
    <svg {...s} aria-label="Phoenix lander">
      <circle cx="18" cy="48" r="15" fill="#2b3f75" stroke="#5ce1e6" strokeWidth="2" />
      <circle cx="82" cy="48" r="15" fill="#2b3f75" stroke="#5ce1e6" strokeWidth="2" />
      <rect x="32" y="40" width="36" height="16" rx="5" fill="#e7e2da" stroke="#8a8f9e" strokeWidth="3" />
      <line x1="40" y1="56" x2="34" y2="80" stroke="#d6a43a" strokeWidth="4" />
      <line x1="60" y1="56" x2="66" y2="80" stroke="#d6a43a" strokeWidth="4" />
      <path d="M62 42 L80 24 L92 40" stroke="#8a8f9e" strokeWidth="4" fill="none" />
      <rect x="20" y="82" width="60" height="6" rx="3" fill="#b8e6ff" />
    </svg>
  );
}
