/** Simulation seconds: two minutes of day, twenty seconds dusk, four minutes
 * of night, twenty seconds dawn. The world clock pauses with exploration. */
export const DAY_CYCLE_SECONDS = 400;
export function sampleDayCycle(time: number) {
  const t = ((time % DAY_CYCLE_SECONDS) + DAY_CYCLE_SECONDS) % DAY_CYCLE_SECONDS;
  const smooth = (x: number) => x * x * (3 - 2 * x);
  if (t < 120) return { phase: "day", light: 1 } as const;
  if (t < 140) return { phase: "dusk", light: 1 - smooth((t - 120) / 20) } as const;
  if (t < 380) return { phase: "night", light: 0 } as const;
  return { phase: "dawn", light: smooth((t - 380) / 20) } as const;
}
