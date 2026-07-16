const STYLE_ID = 'dungeon-shot-ui-style';

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
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
      pointer-events: none; position: absolute; left: 0; right: 0; top: 0;
      height: 52px; background: rgba(11, 18, 32, 0.92);
      border-bottom: 2px solid #2d4a3e;
      display: none; align-items: center; justify-content: space-between;
      padding: 0 18px;
    }
    #hud .left { display: flex; flex-direction: column; gap: 2px; }
    #hud .hp { font-size: 15px; }
    #hud .meta { font-size: 12px; color: #8fa3b0; }
    #crosshair {
      display: none; position: absolute; left: 50%; top: 50%;
      width: 12px; height: 12px; margin: -6px 0 0 -6px;
      border: 1px solid rgba(226,232,240,0.7); border-radius: 50%;
    }
    #minimap {
      display: none; position: absolute; top: 60px; right: 14px;
      background: rgba(6,10,16,0.95); border: 1px solid #2d4a3e;
      border-radius: 4px; padding: 6px;
    }
    #minimap canvas { display: block; }
    #map-overlay, #upgrade-overlay, #pause-overlay, #iris {
      display: none; pointer-events: auto; position: absolute; inset: 0;
    }
    #map-overlay {
      background: rgba(0,0,0,0.82);
      flex-direction: column; align-items: center; justify-content: center; gap: 16px;
    }
    #map-overlay.show { display: flex; }
    #upgrade-overlay, #pause-overlay {
      flex-direction: column; align-items: center; justify-content: center;
      background: rgba(5, 8, 6, 0.88);
      opacity: 0;
      transition: opacity 180ms ease-out;
    }
    #upgrade-overlay.show, #pause-overlay.show {
      display: flex;
      opacity: 1;
    }
    #upgrade-overlay::before, #pause-overlay::before {
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
    #upgrade-overlay::after, #pause-overlay::after {
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
    #iris {
      pointer-events: none; z-index: 50;
    }
    #iris .bar { position: absolute; background: #000; }
    #iris .top, #iris .bottom { left: 0; right: 0; height: 0; }
    #iris .top { top: 0; } #iris .bottom { bottom: 0; }
    #iris .left, #iris .right { top: 0; bottom: 0; width: 0; }
    #iris .left { left: 0; } #iris .right { right: 0; }
    #click-tip {
      display: none; position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
      color: #a0aec0; font-size: 13px;
    }
  `;
  document.head.appendChild(s);
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
