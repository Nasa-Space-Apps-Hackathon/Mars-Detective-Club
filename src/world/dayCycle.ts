/** Simulation seconds: one minute of day, twenty seconds dusk, two minutes
 * of night, twenty seconds dawn. The world clock pauses with exploration. */
export const DAY_CYCLE_SECONDS = 400;
export function sampleDayCycle(time: number) {
  const t =
    ((time % DAY_CYCLE_SECONDS) + DAY_CYCLE_SECONDS) % DAY_CYCLE_SECONDS;
  const smooth = (x: number) => x * x * (3 - 2 * x);
  if (t < 60) return { phase: "day", light: 1 } as const;
  if (t < 80)
    return { phase: "dusk", light: 1 - smooth((t - 60) / 20) } as const;
  if (t < 120) return { phase: "night", light: 0 } as const;
  return { phase: "dawn", light: smooth((t - 120) / 20) } as const;
}
