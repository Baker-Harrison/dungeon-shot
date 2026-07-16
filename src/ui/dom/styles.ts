const STYLE_ID = 'dungeon-shot-ui-style';

export function ensureStyles(): void {
  let s = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!s) {
    s = document.createElement('style');
    s.id = STYLE_ID;
    document.head.appendChild(s);
  }
  s.textContent = `
    #ui-root {
      position: fixed; inset: 0; pointer-events: none; z-index: 10;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      color: #e2e8f0;
    }
    #ui-root .panel {
      pointer-events: auto;
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(8, 12, 18, 0.92);
      gap: 14px;
    }
    #ui-root h1 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 48px; font-weight: 400; color: #9ae6b4; letter-spacing: 0.04em;
    }
    #ui-root h2 { font-size: 28px; color: #e2e8f0; font-weight: 600; }
    #ui-root p { color: #a0aec0; font-size: 14px; text-align: center; max-width: 420px; line-height: 1.5; }
    #ui-root button, #ui-root .btn {
      pointer-events: auto; cursor: pointer;
      background: transparent; border: 1px solid #2d4a3e; color: #68d391;
      padding: 12px 22px; font: inherit; font-size: 18px; min-width: 220px;
    }
    #ui-root button:hover, #ui-root .btn:hover { border-color: #68d391; color: #9ae6b4; }
    #ui-root .muted { color: #63b3ed; border-color: #2a4365; }
    #ui-root .muted:hover { color: #90cdf4; border-color: #63b3ed; }
    #hud {
      display: none;
      pointer-events: none;
      position: absolute;
      inset: 0;
    }
    #hud .hud-objective {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      padding: 6px 14px;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(154, 230, 180, 0.72);
      background: rgba(6, 12, 10, 0.55);
      border: 1px solid rgba(45, 74, 62, 0.85);
      white-space: nowrap;
    }
    #hud .hud-health {
      position: absolute;
      left: 22px;
      bottom: 28px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 220px;
    }
    #hud .hud-chip {
      font-size: 11px;
      letter-spacing: 0.18em;
      color: #68d391;
      text-shadow: 0 1px 0 rgba(0,0,0,0.65);
    }
    #hud .hud-health-track {
      width: 220px;
      height: 14px;
      background: rgba(8, 14, 18, 0.78);
      border: 1px solid #2d4a3e;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.35);
      overflow: hidden;
    }
    #hud .hud-health-fill {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #276749 0%, #48bb78 55%, #9ae6b4 100%);
      transform-origin: left center;
      transition: width 120ms linear;
    }
    #hud.hurt .hud-health-fill {
      background: linear-gradient(90deg, #c05621 0%, #dd6b20 55%, #f6ad55 100%);
    }
    #hud.low-hp .hud-health-fill {
      background: linear-gradient(90deg, #9b2c2c 0%, #e53e3e 60%, #fc8181 100%);
    }
    #hud.low-hp .hud-health-text { color: #fc8181; }
    #hud .hud-health-text {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #e2e8f0;
      text-shadow: 0 2px 8px rgba(0,0,0,0.75);
    }
    #hud .hud-ammo {
      position: absolute;
      right: 22px;
      bottom: 28px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      min-width: 160px;
    }
    #hud .hud-weapon {
      font-size: 12px;
      letter-spacing: 0.16em;
      color: #8fa3b0;
      text-shadow: 0 1px 0 rgba(0,0,0,0.65);
    }
    #hud .hud-ammo-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      line-height: 1;
      text-shadow: 0 2px 10px rgba(0,0,0,0.8);
    }
    #hud .hud-ammo-mag {
      font-size: 54px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #e2e8f0;
    }
    #hud .hud-ammo-sep {
      font-size: 28px;
      color: #4a5568;
      padding-bottom: 4px;
    }
    #hud .hud-ammo-reserve {
      font-size: 28px;
      font-weight: 600;
      color: #a0aec0;
    }
    #hud.mag-low .hud-ammo-mag { color: #f6ad55; }
    #hud.mag-empty .hud-ammo-mag { color: #fc8181; }
    #hud.reloading .hud-ammo-mag { color: #63b3ed; }
    #hud .hud-ammo-hint {
      opacity: 0;
      font-size: 11px;
      letter-spacing: 0.18em;
      color: #fc8181;
      transition: opacity 120ms ease;
    }
    #hud.reloading .hud-ammo-hint { color: #63b3ed; }
    #hud .hud-ammo-hint.show { opacity: 1; }
    #hud .hud-relics {
      position: absolute;
      left: 22px;
      top: 16px;
      font-size: 13px;
      letter-spacing: 0.14em;
      color: #f6e05e;
      text-shadow: 0 1px 0 rgba(0,0,0,0.65);
      padding: 6px 10px;
      background: rgba(6, 12, 10, 0.55);
      border: 1px solid rgba(214, 158, 46, 0.55);
    }
    #crosshair {
      display: none;
      position: absolute;
      left: 50%;
      top: 50%;
      width: 22px;
      height: 22px;
      margin: -11px 0 0 -11px;
    }
    #crosshair .arm {
      position: absolute;
      background: rgba(226, 232, 240, 0.88);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.45);
    }
    #crosshair .arm.n, #crosshair .arm.s {
      left: 10px; width: 2px; height: 6px;
    }
    #crosshair .arm.n { top: 0; }
    #crosshair .arm.s { bottom: 0; }
    #crosshair .arm.e, #crosshair .arm.w {
      top: 10px; height: 2px; width: 6px;
    }
    #crosshair .arm.e { right: 0; }
    #crosshair .arm.w { left: 0; }
    #minimap {
      display: none;
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(6,10,16,0.82);
      border: 1px solid #2d4a3e;
      padding: 6px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    }
    #minimap canvas { display: block; }
    #minimap::before {
      content: "MAP";
      display: block;
      font-size: 9px;
      letter-spacing: 0.16em;
      color: #68d391;
      margin-bottom: 4px;
    }
    #map-overlay, #upgrade-overlay, #shop-overlay, #pause-overlay, #iris {
      display: none; pointer-events: auto; position: absolute; inset: 0;
    }
    #map-overlay {
      background: rgba(0,0,0,0.82);
      flex-direction: column; align-items: center; justify-content: center; gap: 16px;
    }
    #map-overlay.show { display: flex; }
    #upgrade-overlay, #shop-overlay, #pause-overlay {
      flex-direction: column; align-items: center; justify-content: center;
      background: rgba(5, 8, 6, 0.88);
      opacity: 0;
      transition: opacity 180ms ease-out;
    }
    #upgrade-overlay.show, #shop-overlay.show, #pause-overlay.show {
      display: flex;
      opacity: 1;
    }
    #upgrade-overlay::before, #shop-overlay::before, #pause-overlay::before {
      content: "";
      position: absolute; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.18) 0px,
        rgba(0, 0, 0, 0.18) 1px,
        transparent 1px,
        transparent 3px
      );
      opacity: 0.55;
    }
    #upgrade-overlay::after, #shop-overlay::after, #pause-overlay::after {
      content: "";
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.55) 100%);
    }
    #upgrade-overlay .upgrade-panel, #pause-overlay .upgrade-panel {
      position: relative; z-index: 1;
      display: flex; flex-direction: column; align-items: stretch;
      width: min(440px, calc(100vw - 48px));
      gap: 10px;
      padding: 22px 24px 18px;
      border: 1px solid #2d4a3e;
      background: rgba(8, 14, 10, 0.72);
      box-shadow: inset 0 0 40px rgba(104, 211, 145, 0.04);
    }
    #upgrade-overlay .upgrade-title, #pause-overlay .upgrade-title {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.12em;
      color: #9ae6b4;
      text-align: center;
    }
    #upgrade-overlay .upgrade-rule, #pause-overlay .upgrade-rule {
      height: 1px;
      background: linear-gradient(to right, transparent, #2d4a3e 20%, #68d391 50%, #2d4a3e 80%, transparent);
      margin: 2px 0 8px;
    }
    #upgrade-overlay .upgrade-opts, #pause-overlay .upgrade-opts {
      display: flex; flex-direction: column; gap: 8px;
    }
    #upgrade-overlay .upgrade-opt, #pause-overlay .upgrade-opt {
      display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
      width: 100%; min-width: 0;
      text-align: left;
      padding: 12px 14px;
      background: rgba(0, 0, 0, 0.28);
      border: 1px solid #2d4a3e;
      color: #68d391;
      font: inherit; font-size: 15px;
      cursor: default;
      transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
    }
    #upgrade-overlay .upgrade-opt .opt-key, #pause-overlay .upgrade-opt .opt-key {
      color: #9ae6b4;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    #upgrade-overlay .upgrade-opt .opt-name, #pause-overlay .upgrade-opt .opt-name {
      color: #68d391;
    }
    #upgrade-overlay .upgrade-opt .opt-rarity, #pause-overlay .upgrade-opt .opt-rarity {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-right: 4px;
    }
    #upgrade-overlay .upgrade-opt .rarity-common, #pause-overlay .upgrade-opt .rarity-common {
      color: #a0aec0;
    }
    #upgrade-overlay .upgrade-opt .rarity-uncommon, #pause-overlay .upgrade-opt .rarity-uncommon {
      color: #68d391;
    }
    #upgrade-overlay .upgrade-opt .rarity-rare, #pause-overlay .upgrade-opt .rarity-rare {
      color: #f6ad55;
    }
    #upgrade-overlay .upgrade-opt .opt-desc, #pause-overlay .upgrade-opt .opt-desc {
      color: #6b8f7a;
      font-size: 12px;
      line-height: 1.35;
    }
    #upgrade-overlay.disarmed .upgrade-opt, #pause-overlay.disarmed .upgrade-opt {
      pointer-events: none;
      opacity: 0.72;
    }
    #upgrade-overlay.armed .upgrade-opt, #pause-overlay.armed .upgrade-opt {
      pointer-events: auto;
      cursor: pointer;
      opacity: 1;
    }
    #upgrade-overlay.armed .upgrade-opt:hover,
    #upgrade-overlay.armed .upgrade-opt:focus-visible,
    #pause-overlay.armed .upgrade-opt:hover,
    #pause-overlay.armed .upgrade-opt:focus-visible {
      border-color: #68d391;
      color: #9ae6b4;
      background: rgba(104, 211, 145, 0.08);
      outline: none;
    }
    #upgrade-overlay.armed .upgrade-opt:hover .opt-name,
    #upgrade-overlay.armed .upgrade-opt:focus-visible .opt-name,
    #pause-overlay.armed .upgrade-opt:hover .opt-name,
    #pause-overlay.armed .upgrade-opt:focus-visible .opt-name {
      color: #9ae6b4;
    }
    #pause-overlay .upgrade-opt.muted-opt .opt-name {
      color: #7a9e8a;
    }
    #upgrade-overlay .upgrade-hint, #pause-overlay .upgrade-hint {
      margin: 10px 0 0;
      text-align: center;
      font-size: 11px;
      letter-spacing: 0.08em;
      color: #5a7364;
    }
    #shop-overlay .shop-panel {
      position: relative; z-index: 1;
      display: flex; flex-direction: column; align-items: stretch;
      width: min(440px, calc(100vw - 48px));
      gap: 10px;
      padding: 22px 24px 18px;
      border: 1px solid #744210;
      background: rgba(14, 12, 8, 0.78);
      box-shadow: inset 0 0 40px rgba(214, 158, 46, 0.06);
    }
    #shop-overlay .shop-title {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.12em;
      color: #f6e05e;
      text-align: center;
    }
    #shop-overlay .shop-rule {
      height: 1px;
      background: linear-gradient(to right, transparent, #744210 20%, #d69e2e 50%, #744210 80%, transparent);
      margin: 2px 0 8px;
    }
    #shop-overlay .shop-opts {
      display: flex; flex-direction: column; gap: 8px;
    }
    #shop-overlay .shop-opt {
      display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
      width: 100%; min-width: 0;
      text-align: left;
      padding: 12px 14px;
      background: rgba(0, 0, 0, 0.28);
      border: 1px solid #744210;
      color: #f6e05e;
      font: inherit; font-size: 15px;
      cursor: default;
      transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
    }
    #shop-overlay .shop-opt .opt-key { color: #faf089; font-weight: 600; letter-spacing: 0.04em; }
    #shop-overlay .shop-opt .opt-name { color: #f6e05e; }
    #shop-overlay .shop-opt .opt-tag {
      font-size: 11px; font-weight: 700; letter-spacing: 0.08em; margin-right: 4px; color: #d69e2e;
    }
    #shop-overlay .shop-opt .opt-desc { color: #b7791f; font-size: 12px; line-height: 1.35; }
    #shop-overlay .shop-opt:not(:disabled) { pointer-events: auto; cursor: pointer; opacity: 1; }
    #shop-overlay .shop-opt:not(:disabled):hover,
    #shop-overlay .shop-opt:not(:disabled):focus-visible {
      border-color: #f6e05e;
      color: #faf089;
      background: rgba(214, 158, 46, 0.1);
      outline: none;
    }
    #shop-overlay .shop-opt:not(:disabled):hover .opt-name,
    #shop-overlay .shop-opt:not(:disabled):focus-visible .opt-name { color: #faf089; }
    #shop-overlay .shop-opt.muted-opt .opt-name { color: #975a16; }
    #shop-overlay .shop-hint {
      margin: 10px 0 0;
      text-align: center;
      font-size: 11px;
      letter-spacing: 0.08em;
      color: #975a16;
    }
    #iris {
      pointer-events: none; z-index: 50;
    }
    #iris .bar { position: absolute; background: #000; }
    #iris .top, #iris .bottom { left: 0; right: 0; height: 0; }
    #iris .top { top: 0; } #iris .bottom { bottom: 0; }
    #iris .left, #iris .right { top: 0; bottom: 0; width: 0; }
    #iris .left { left: 0; } #iris .right { right: 0; }
    #click-tip {
      display: none;
      position: absolute;
      bottom: 118px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 14px;
      color: #a0aec0;
      font-size: 12px;
      letter-spacing: 0.04em;
      background: rgba(6, 12, 10, 0.72);
      border: 1px solid rgba(45, 74, 62, 0.8);
    }
  `;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
