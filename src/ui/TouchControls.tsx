"use client";

import { useEffect, useRef, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import { canMove } from "@/store/useGame";
import styles from "./TouchControls.module.css";

const TOUCH_QUERY = "(max-width: 800px), (any-pointer: coarse)";
const DIRECTIONS = ["KeyW", "KeyA", "KeyS", "KeyD"] as const;
const subscribe = (listener: () => void) => {
  const media = window.matchMedia(TOUCH_QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};
const snapshot = () => window.matchMedia(TOUCH_QUERY).matches;

/** Feed the existing keyboard controls; the player and Mars physics stay unchanged. */
export default function TouchControls({ children }: { children: ReactNode }) {
  const visible = useSyncExternalStore(subscribe, snapshot, () => false);
  const stick = useRef<HTMLDivElement>(null);
  const jump = useRef<HTMLButtonElement>(null);
  const pointers = useRef<{ stick: number | null; jump: number | null }>({ stick: null, jump: null });
  const held = useRef(new Set<string>());

  const setKey = (code: string, pressed: boolean) => {
    if (held.current.has(code) === pressed) return;
    if (pressed) held.current.add(code); else held.current.delete(code);
    window.dispatchEvent(new KeyboardEvent(pressed ? "keydown" : "keyup", {
      code, key: code === "Space" ? " " : code.slice(-1).toLowerCase(), bubbles: true, cancelable: true,
    }));
  };

  useEffect(() => {
    const activeKeys = held.current;
    const activePointers = pointers.current;
    const stickElement = stick.current;
    const jumpElement = jump.current;
    const reset = () => {
      for (const code of activeKeys) window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }));
      activeKeys.clear();
      const stickId = activePointers.stick;
      const jumpId = activePointers.jump;
      activePointers.stick = activePointers.jump = null;
      if (stickId !== null && stickElement?.hasPointerCapture(stickId)) stickElement.releasePointerCapture(stickId);
      if (jumpId !== null && jumpElement?.hasPointerCapture(jumpId)) jumpElement.releasePointerCapture(jumpId);
      stickElement?.style.setProperty("--stick-x", "0px");
      stickElement?.style.setProperty("--stick-y", "0px");
      if (stickElement) stickElement.dataset.active = "false";
      if (jumpElement) jumpElement.dataset.active = "false";
      stickElement?.querySelectorAll("kbd").forEach((label) => { label.dataset.active = "false"; });
    };
    const visibility = () => { if (document.hidden) reset(); };
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", visibility);
      reset();
    };
  }, [visible]);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (pointers.current.stick !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const box = event.currentTarget.getBoundingClientRect();
    const radius = box.width / 2;
    const dx = (event.clientX - box.left - radius) / radius;
    const dy = (event.clientY - box.top - radius) / radius;
    const distance = Math.hypot(dx, dy);
    const scale = Math.max(1, distance);
    event.currentTarget.style.setProperty("--stick-x", `${dx / scale * radius * 0.5}px`);
    event.currentTarget.style.setProperty("--stick-y", `${dy / scale * radius * 0.5}px`);
    const threshold = Math.max(Math.abs(dx), Math.abs(dy)) * 0.45;
    const active = distance > 0.2 && canMove();
    const directions = [active && dy < -threshold, active && dx < -threshold, active && dy > threshold, active && dx > threshold];
    DIRECTIONS.forEach((code, index) => {
      setKey(code, directions[index]);
      const label = event.currentTarget.querySelector(`[data-key="${code}"]`) as HTMLElement | null;
      if (label) label.dataset.active = String(directions[index]);
    });
  };

  const releaseStick = (event: PointerEvent<HTMLDivElement>) => {
    if (pointers.current.stick !== event.pointerId) return;
    pointers.current.stick = null;
    DIRECTIONS.forEach((code) => setKey(code, false));
    event.currentTarget.style.setProperty("--stick-x", "0px");
    event.currentTarget.style.setProperty("--stick-y", "0px");
    event.currentTarget.dataset.active = "false";
    event.currentTarget.querySelectorAll("kbd").forEach((label) => { label.dataset.active = "false"; });
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const releaseJump = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointers.current.jump !== event.pointerId) return;
    pointers.current.jump = null;
    setKey("Space", false);
    event.currentTarget.dataset.active = "false";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!visible) return children;
  return <>
    <div ref={stick} className={styles.joystick} role="group" aria-label="Movement joystick: drag to move with W A S D"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (pointers.current.stick !== null || event.button !== 0 || !canMove()) return;
        pointers.current.stick = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.dataset.active = "true";
        move(event);
      }}
      onPointerMove={move} onPointerUp={releaseStick} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick}>
      {DIRECTIONS.map((code) => <kbd key={code} data-key={code} className={styles[code]} aria-hidden="true">{code.slice(-1)}</kbd>)}
      <span className={styles.thumb} aria-hidden="true" />
    </div>
    <div className={styles.navigation}>
      <button ref={jump} type="button" className={styles.jump} aria-label="Jump" title="Jump (Space)"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (pointers.current.jump !== null || event.button !== 0 || !canMove()) return;
          event.preventDefault();
          event.stopPropagation();
          pointers.current.jump = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.dataset.active = "true";
          setKey("Space", true);
        }}
        onPointerUp={releaseJump} onPointerCancel={releaseJump} onLostPointerCapture={releaseJump}
        onClick={(event) => { if (event.detail === 0 && canMove()) { setKey("Space", true); setKey("Space", false); } }}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17V4m-5 5 5-5 5 5M5 17v4h14v-4" /></svg>
        <span>Jump</span>
      </button>
      {children}
    </div>
  </>;
}
