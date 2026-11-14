"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/store/useGame";
import { TOOLBOX_COST } from "@/world/salvageData";
import { Overlay } from "./primitives";
import styles from "./SupplyUI.module.css";

export default function ShipShop() {
  const salvage = useGame((s) => s.salvage);
  const toolbox = useGame((s) => s.toolbox);
  const buy = useGame((s) => s.buyToolbox);
  const close = useGame((s) => s.closeShop);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  const remaining = Math.max(0, TOOLBOX_COST - salvage);
  return <Overlay>
    <div ref={panel} className={styles.shop} role="dialog" aria-modal="true" aria-labelledby="depot-title" onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const buttons = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
      const first = buttons[0]; const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className={styles.shopHeader}><h2 id="depot-title">Ship supply depot</h2><button className={styles.close} onClick={close} aria-label="Close supply depot">×</button></div>
      <p>Your ship recycles field scrap into expedition tools.</p>
      <div className={styles.inventory}><span>Recyclable scrap</span><strong>{salvage} <small>pieces</small></strong></div>
      <div className={styles.tool}><svg viewBox="0 0 80 64" aria-hidden="true"><path d="M27 20V9h26v11M8 22h64v34H8Zm0 13h64M35 29h10v14H35Z" /></svg><div><h3>Repair toolbox</h3><p>Repair both offline simulation stations. Keep it for the whole expedition.</p></div></div>
      <p className={styles.price}>Trade {TOOLBOX_COST} scrap pieces · Reusable</p>
      <p className={styles.shopStatus} role="status">{toolbox ? "Toolbox packed. Opportunity and Phoenix can now be repaired with E." : remaining > 0 ? `Collect ${remaining} more glowing scrap ${remaining === 1 ? "piece" : "pieces"}. The compass will help you find them.` : "You have enough scrap for the toolbox."}</p>
      <button className={styles.trade} disabled={toolbox || remaining > 0} onClick={buy}>{toolbox ? "Toolbox in your pack" : `Trade ${TOOLBOX_COST} scrap for toolbox`}</button>
      <button className={styles.back} onClick={close}>Back to exploring <kbd>Esc</kbd></button>
      <p className={styles.note}>Repairs are part of this virtual game. The real NASA missions remain retired.</p>
    </div>
  </Overlay>;
}
