"use client";

/**
 * Shared keyboard + mouse input for the world (Person 1).
 * Key codes are layout-independent (KeyW works on Arabic keyboards too).
 */
export const keys: Record<string, boolean> = {};
export const mouse = { dragging: false, dx: 0, dy: 0, wheel: 0 };

let attached = 0;

export function attachInput(canvas: HTMLElement) {
  attached++;
  const down = (e: KeyboardEvent) => (keys[e.code] = true);
  const up = (e: KeyboardEvent) => (keys[e.code] = false);
  const blur = () => {
    Object.keys(keys).forEach((k) => (keys[k] = false));
    mouse.dragging = false;
  };
  const pDown = (e: PointerEvent) => {
    mouse.dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const pMove = (e: PointerEvent) => {
    if (!mouse.dragging) return;
    mouse.dx += e.movementX;
    mouse.dy += e.movementY;
  };
  const pUp = () => (mouse.dragging = false);
  const wheel = (e: WheelEvent) => (mouse.wheel += Math.sign(e.deltaY));

  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  canvas.addEventListener("pointerdown", pDown);
  window.addEventListener("pointermove", pMove);
  window.addEventListener("pointerup", pUp);
  canvas.addEventListener("wheel", wheel, { passive: true });
  return () => {
    attached--;
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
    canvas.removeEventListener("pointerdown", pDown);
    window.removeEventListener("pointermove", pMove);
    window.removeEventListener("pointerup", pUp);
    canvas.removeEventListener("wheel", wheel);
  };
}

export const isAttached = () => attached > 0;
