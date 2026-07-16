import * as THREE from 'three';
import { OPPOSITE } from '../dungeon/types';
import { rollUpgradeChoices, rollUpgradeOffer } from '../dungeon/generate';
import { RUN_UPGRADES, type UpgradeId } from '../data/upgrades';
import {
  META_UPGRADES,
  metaUpgradeCost,
  type MetaUpgradeId,
} from '../data/metaUpgrades';
import { applyAmmoPickup, canReload, reloadAmmo, trySpendAmmo } from '../data/ammo';
import { aimWithSpread, getWeapon } from '../data/weapons';
import {
  applyRunUpgrade,
  getMeta,
  getRun,
  markPlayerDead,
  markRoomCleared,
  markRoomVisited,
  setMeta,
  startNewRun,
} from '../state/session';
import { addCurrency, loadMeta, saveMeta, setMetaLevel } from '../state/save';
import { makeSeed } from '../util/rng';
import {
  BASE_STATS,
  COLORS,
  PLAYER_RADIUS,
  UPGRADE_OFFER_CHANCE,
} from '../util/constants';
import { FpsController } from '../fps/controller';
import { Input } from '../fps/input';
import {
  buildRoom,
  setDoorsLocked,
  spawnPoint,
  type BuiltRoom,
  type DoorTrigger,
} from '../world/roomBuilder';
import { EnemySystem } from '../world/enemies';
import { ProjectileSystem } from '../world/projectiles';
import { circleHitsAabb } from '../world/colliders';
import { ensureStyles, el } from '../ui/dom/styles';

type Screen = 'menu' | 'run' | 'results' | 'hub';

interface AmmoPickup {
  mesh: THREE.Mesh;
  amount: number;
  alive: boolean;
}

const AMMO_PICKUP_AMOUNT = 8;
const RARITY_LABEL: Record<string, string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
};

export class GameApp {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private controller: FpsController;
  private input: Input;
  private uiRoot: HTMLElement;
  private hud!: HTMLElement;
  private hudObjective!: HTMLElement;
  private healthFill!: HTMLElement;
  private healthText!: HTMLElement;
  private weaponNameEl!: HTMLElement;
  private ammoMagEl!: HTMLElement;
  private ammoReserveEl!: HTMLElement;
  private ammoHintEl!: HTMLElement;
  private crosshair!: HTMLElement;
  private clickTip!: HTMLElement;
  private minimapWrap!: HTMLElement;
  private minimapCanvas!: HTMLCanvasElement;
  private mapOverlay!: HTMLElement;
  private upgradeOverlay!: HTMLElement;
  private pauseOverlay!: HTMLElement;
  private iris!: HTMLElement;
  private panelHost!: HTMLElement;

  private built: BuiltRoom | null = null;
  private roomRoot: THREE.Group | null = null;
  private enemies: EnemySystem;
  private projectiles: ProjectileSystem;
  private ammoPickups: AmmoPickup[] = [];
  private reloadWasDown = false;
  private reloading = false;
  private reloadEndsAt = 0;

  private screen: Screen = 'menu';
  private doorsLocked = false;
  private awaitingUpgrade = false;
  private upgradeArmed = false;
  private upgradeArmReady = false;
  private upgradeBlockUntilRelease = false;
  private upgradeChoices: UpgradeId[] = [];
  private upgradeArmTimer: ReturnType<typeof setTimeout> | null = null;
  private wiping = false;
  private mapOpen = false;
  private paused = false;
  private pauseArmed = false;
  private pauseArmTimer: ReturnType<typeof setTimeout> | null = null;
  private pauseOpenedAt = 0;
  /** True when we called exitPointerLock on purpose (map/upgrade/pause/UI). */
  private ignorePointerUnlock = false;
  private runEnding = false;
  private iFrameUntil = 0;
  private fireTimer = 0;
  private travelLockUntil = 0;
  private last = performance.now();
  private clock = 0;

  constructor(container: HTMLElement) {
    ensureStyles();
    setMeta(loadMeta());

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(COLORS.bg);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    container.appendChild(this.renderer.domElement);

    this.controller = new FpsController(
      window.innerWidth / window.innerHeight,
    );
    this.input = new Input(this.renderer.domElement);
    this.enemies = new EnemySystem(this.scene);
    this.projectiles = new ProjectileSystem(this.scene);
    this.scene.fog = new THREE.FogExp2(COLORS.bg, 0.018);

    this.uiRoot = el('div');
    this.uiRoot.id = 'ui-root';
    document.body.appendChild(this.uiRoot);
    this.buildDom();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKey);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.showMenu();
    requestAnimationFrame(this.frame);
  }

  private buildDom(): void {
    this.panelHost = el('div');
    this.uiRoot.appendChild(this.panelHost);

    this.hud = el('div');
    this.hud.id = 'hud';

    this.hudObjective = el('div', 'hud-objective');
    this.hud.appendChild(this.hudObjective);

    const health = el('div', 'hud-health');
    health.append(el('div', 'hud-chip', 'HP'));
    const healthTrack = el('div', 'hud-health-track');
    this.healthFill = el('div', 'hud-health-fill');
    healthTrack.appendChild(this.healthFill);
    this.healthText = el('div', 'hud-health-text');
    health.append(healthTrack, this.healthText);
    this.hud.appendChild(health);

    const ammo = el('div', 'hud-ammo');
    this.weaponNameEl = el('div', 'hud-weapon');
    const ammoRow = el('div', 'hud-ammo-row');
    this.ammoMagEl = el('span', 'hud-ammo-mag');
    const ammoSep = el('span', 'hud-ammo-sep', '/');
    this.ammoReserveEl = el('span', 'hud-ammo-reserve');
    ammoRow.append(this.ammoMagEl, ammoSep, this.ammoReserveEl);
    this.ammoHintEl = el('div', 'hud-ammo-hint', 'R RELOAD');
    ammo.append(this.weaponNameEl, ammoRow, this.ammoHintEl);
    this.hud.appendChild(ammo);

    this.uiRoot.appendChild(this.hud);

    this.crosshair = el('div');
    this.crosshair.id = 'crosshair';
    for (const arm of ['n', 'e', 's', 'w']) {
      this.crosshair.appendChild(el('span', `arm ${arm}`));
    }
    this.uiRoot.appendChild(this.crosshair);

    this.clickTip = el('div');
    this.clickTip.id = 'click-tip';
    this.clickTip.textContent = 'Click to capture mouse · WASD move · LMB shoot · M map · Esc pause';
    this.uiRoot.appendChild(this.clickTip);

    this.minimapWrap = el('div');
    this.minimapWrap.id = 'minimap';
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = 120;
    this.minimapCanvas.height = 120;
    this.minimapWrap.appendChild(this.minimapCanvas);
    this.uiRoot.appendChild(this.minimapWrap);

    this.mapOverlay = el('div');
    this.mapOverlay.id = 'map-overlay';
    this.uiRoot.appendChild(this.mapOverlay);

    this.upgradeOverlay = el('div');
    this.upgradeOverlay.id = 'upgrade-overlay';
    this.uiRoot.appendChild(this.upgradeOverlay);

    this.pauseOverlay = el('div');
    this.pauseOverlay.id = 'pause-overlay';
    this.uiRoot.appendChild(this.pauseOverlay);

    this.iris = el('div');
    this.iris.id = 'iris';
    for (const side of ['top', 'bottom', 'left', 'right']) {
      const b = el('div', `bar ${side}`);
      this.iris.appendChild(b);
    }
    this.uiRoot.appendChild(this.iris);
  }

  private onResize = (): void => {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.controller.camera.aspect = window.innerWidth / window.innerHeight;
    this.controller.camera.updateProjectionMatrix();
  };

  private onKey = (e: KeyboardEvent): void => {
    if (this.screen !== 'run') return;

    if (e.code === 'Escape') {
      e.preventDefault();
      if (this.awaitingUpgrade || this.wiping || this.runEnding) return;
      if (this.mapOpen) {
        this.toggleMap(false);
        return;
      }
      if (this.paused) {
        // Browser may fire Escape after exiting pointer lock; don't instantly unpause.
        if (performance.now() - this.pauseOpenedAt < 250) return;
        this.closePause(true);
        return;
      }
      this.openPause();
      return;
    }

    if (e.code === 'KeyM') {
      if (this.paused || this.awaitingUpgrade || this.wiping || this.runEnding) return;
      e.preventDefault();
      this.toggleMap();
    }
  };

  private onPointerLockChange = (): void => {
    const locked =
      document.pointerLockElement === this.renderer.domElement;
    if (locked) {
      this.ignorePointerUnlock = false;
      return;
    }
    if (this.ignorePointerUnlock) {
      this.ignorePointerUnlock = false;
      return;
    }
    // Esc while locked exits pointer lock without a reliable keydown — treat as pause.
    if (this.screen !== 'run') return;
    if (
      this.paused ||
      this.awaitingUpgrade ||
      this.mapOpen ||
      this.wiping ||
      this.runEnding
    ) {
      return;
    }
    this.openPause();
  };

  /** Exit pointer lock without treating it as an Esc-pause. */
  private releasePointerLock(): void {
    if (document.pointerLockElement !== this.renderer.domElement) return;
    this.ignorePointerUnlock = true;
    document.exitPointerLock();
  }

  private clearPanel(): void {
    this.panelHost.replaceChildren();
  }

  private showMenu(): void {
    this.screen = 'menu';
    this.hideRunUi();
    this.clearPanel();
    const panel = el('div', 'panel');
    panel.append(
      el('h1', undefined, 'DUNGEON SHOT'),
      el('p', undefined, 'First-person dungeon roguelite · WASD + mouse'),
      el('p', undefined, `Credits: ${getMeta().currency}`),
    );
    const start = el('button', undefined, '[ START RUN ]');
    start.onclick = () => this.beginRun();
    const hub = el('button', 'muted', '[ META HUB ]');
    hub.onclick = () => this.showHub();
    panel.append(start, hub);
    this.panelHost.appendChild(panel);
  }

  private showHub(): void {
    this.screen = 'hub';
    this.hideRunUi();
    this.clearPanel();
    const panel = el('div', 'panel');
    panel.append(el('h2', undefined, 'META HUB'));
    const cur = el('p');
    const refresh = () => {
      const meta = getMeta();
      cur.textContent = `Currency: ${meta.currency}`;
      list.replaceChildren();
      for (const def of META_UPGRADES) {
        const level = meta.upgrades[def.id];
        const maxed = level >= def.maxLevel;
        const cost = metaUpgradeCost(def, level);
        const row = el('button', maxed ? 'muted' : undefined);
        row.textContent = maxed
          ? `${def.name} Lv ${level}/${def.maxLevel} (MAX)`
          : `${def.name} Lv ${level}/${def.maxLevel} — ${cost}c`;
        row.disabled = maxed || meta.currency < cost;
        row.onclick = () => {
          if (maxed || getMeta().currency < cost) return;
          let m = getMeta();
          m = { ...m, currency: m.currency - cost };
          m = setMetaLevel(m, def.id as MetaUpgradeId, level + 1);
          setMeta(m);
          saveMeta(m);
          refresh();
        };
        list.appendChild(row);
      }
    };
    const list = el('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '10px';
    panel.append(cur, list);
    const back = el('button', undefined, '[ BACK TO MENU ]');
    back.onclick = () => this.showMenu();
    panel.append(back);
    this.panelHost.appendChild(panel);
    refresh();
  }

  private beginRun(): void {
    this.cancelReload();
    startNewRun(getMeta(), makeSeed());
    this.runEnding = false;
    this.awaitingUpgrade = false;
    this.wiping = false;
    this.mapOpen = false;
    this.closePause(false);
    this.iFrameUntil = 0;
    this.screen = 'run';
    this.clearPanel();
    this.showRunUi();
    this.loadRoom(getRun().currentRoomId);
    this.renderer.domElement.requestPointerLock();
  }

  private cancelReload(): void {
    this.reloading = false;
    this.reloadEndsAt = 0;
  }

  private showRunUi(): void {
    this.hud.style.display = 'block';
    this.crosshair.style.display = 'block';
    this.minimapWrap.style.display = 'block';
    this.clickTip.style.display = 'block';
  }

  private hideRunUi(): void {
    this.hud.style.display = 'none';
    this.crosshair.style.display = 'none';
    this.minimapWrap.style.display = 'none';
    this.clickTip.style.display = 'none';
    this.mapOverlay.classList.remove('show');
    this.upgradeOverlay.classList.remove('show');
    this.closePause(false);
    this.releasePointerLock();
  }

  private clearWorld(): void {
    this.clearAmmoPickups();
    this.enemies.clear();
    this.projectiles.clear();
    if (this.roomRoot) {
      this.scene.remove(this.roomRoot);
      this.roomRoot.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          const mat = m.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
          else mat.dispose();
        }
      });
      this.roomRoot = null;
    }
    this.built = null;
  }

  private clearAmmoPickups(): void {
    for (const p of this.ammoPickups) {
      if (p.alive) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
      }
    }
    this.ammoPickups = [];
  }

  private spawnAmmoPickup(x: number, z: number, amount = AMMO_PICKUP_AMOUNT): void {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, 0.35),
      new THREE.MeshStandardMaterial({
        color: 0xf6e05e,
        emissive: 0x744210,
        emissiveIntensity: 0.4,
      }),
    );
    mesh.position.set(x, 0.2, z);
    this.scene.add(mesh);
    this.ammoPickups.push({ mesh, amount, alive: true });
  }

  private loadRoom(roomId: string): void {
    this.clearWorld();
    const run = getRun();
    const room = run.dungeon.rooms[roomId];
    if (!room) throw new Error(`Missing room ${roomId}`);
    run.currentRoomId = roomId;
    markRoomVisited(roomId);

    this.built = buildRoom(room);
    this.roomRoot = this.built.group;
    this.scene.add(this.roomRoot);

    const pose = spawnPoint(
      run.enteredFrom,
      this.built.width,
      this.built.depth,
    );
    this.controller.setPose(pose.x, pose.z, pose.yaw);
    this.controller.setColliders(this.built.colliders);

    const uncleared = !room.cleared && room.enemies.length > 0;
    this.doorsLocked = uncleared;
    setDoorsLocked(this.built.doors, uncleared);

    if (uncleared) {
      room.enemies.forEach((kind, i) => {
        const angle = (i / Math.max(1, room.enemies.length)) * Math.PI * 2;
        const dist =
          kind === 'boss' || kind === 'miniBoss'
            ? 0
            : Math.min(3.5, Math.min(this.built!.width, this.built!.depth) * 0.2);
        const ex = Math.cos(angle) * dist;
        const ez = Math.sin(angle) * dist;
        this.enemies.spawn(kind, ex, ez, this.clock, room.sectionIndex);
      });
    }

    if (room.type === 'combat' || room.type === 'miniBoss' || room.type === 'boss') {
      const hw = this.built.width * 0.28;
      const hd = this.built.depth * 0.28;
      this.spawnAmmoPickup(hw, hd);
      this.spawnAmmoPickup(-hw, -hd);
    }

    this.travelLockUntil = this.clock + 600;
    this.refreshHud();
  }

  private refreshHud(): void {
    if (this.screen !== 'run') return;
    const run = getRun();
    const room = run.dungeon.rooms[run.currentRoomId]!;
    const weapon = getWeapon(run.weaponId);
    const hpRatio = Math.max(0, Math.min(1, run.hp / Math.max(1, run.maxHp)));

    this.hudObjective.textContent = `SEC ${room.sectionIndex + 1}/${run.dungeon.sectionCount}  ·  ${room.type.toUpperCase()}  ·  ${run.roomsCleared}/${run.dungeon.combatCount}  ·  $${run.currencyEarned}`;

    this.healthFill.style.width = `${hpRatio * 100}%`;
    this.healthText.textContent = `${run.hp} / ${run.maxHp}`;
    this.hud.classList.toggle('low-hp', run.hp <= 1);
    this.hud.classList.toggle('hurt', run.hp < run.maxHp && run.hp > 1);

    this.weaponNameEl.textContent = weapon.name.toUpperCase();
    this.ammoMagEl.textContent = String(run.mag);
    this.ammoReserveEl.textContent = String(run.reserve);
    const magEmpty = run.mag <= 0;
    const magLow = run.mag > 0 && run.mag <= Math.max(1, Math.floor(run.maxMag * 0.25));
    this.hud.classList.toggle('mag-empty', magEmpty);
    this.hud.classList.toggle('mag-low', magLow && !magEmpty);
    this.hud.classList.toggle('reloading', this.reloading);
    if (this.reloading) {
      this.ammoHintEl.textContent = 'RELOADING…';
      this.ammoHintEl.classList.add('show');
    } else {
      this.ammoHintEl.textContent = 'R RELOAD';
      this.ammoHintEl.classList.toggle('show', magEmpty && run.reserve > 0);
    }

    this.drawMinimap();
  }

  private drawMinimap(): void {
    const run = getRun();
    const ctx = this.minimapCanvas.getContext('2d')!;
    const visited = new Set(run.visitedRoomIds);
    const fogged = new Set<string>();
    for (const id of visited) {
      const room = run.dungeon.rooms[id];
      if (!room) continue;
      for (const next of Object.values(room.connections)) {
        if (next && !visited.has(next)) fogged.add(next);
      }
    }
    const ids = [...new Set([...visited, ...fogged])];
    const rooms = ids
      .map((id) => run.dungeon.rooms[id])
      .filter(Boolean);
    if (rooms.length === 0) {
      this.minimapCanvas.width = 120;
      this.minimapCanvas.height = 120;
      ctx.fillStyle = '#060a10';
      ctx.fillRect(0, 0, 120, 120);
      return;
    }
    const minX = Math.min(...rooms.map((r) => r!.x));
    const maxX = Math.max(...rooms.map((r) => r!.x));
    const minY = Math.min(...rooms.map((r) => r!.y));
    const maxY = Math.max(...rooms.map((r) => r!.y));
    const cell = 14;
    const gap = 2;
    const mapW = (maxX - minX + 1) * (cell + gap);
    const mapH = (maxY - minY + 1) * (cell + gap);
    const w = mapW + 8;
    const h = mapH + 8;
    if (this.minimapCanvas.width !== w || this.minimapCanvas.height !== h) {
      this.minimapCanvas.width = w;
      this.minimapCanvas.height = h;
    }
    ctx.fillStyle = '#060a10';
    ctx.fillRect(0, 0, w, h);
    let curCx = 0;
    let curCy = 0;
    let hasCur = false;
    for (const room of rooms) {
      const r = room!;
      const fog = fogged.has(r.id) && !visited.has(r.id);
      const cur = r.id === run.currentRoomId;
      const px = 4 + (r.x - minX) * (cell + gap);
      const py = 4 + (r.y - minY) * (cell + gap);
      ctx.globalAlpha = fog ? 0.45 : 1;
      ctx.fillStyle = cur
        ? '#63b3ed'
        : fog
          ? '#4a5568'
          : r.cleared
            ? '#276749'
            : r.type === 'boss'
              ? '#9f7aea'
              : r.type === 'miniBoss'
                ? '#ed8936'
                : '#2d3748';
      ctx.fillRect(px, py, cell, cell);
      if (cur) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(px, py, cell, cell);
        curCx = px + cell / 2;
        curCy = py + cell / 2;
        hasCur = true;
      }
    }
    ctx.globalAlpha = 1;
    if (hasCur) this.drawFacingMarker(ctx, curCx, curCy, cell * 0.42);
  }

  /** Map N = -Z / canvas up. yaw 0 looks north. */
  private drawFacingMarker(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
  ): void {
    const yaw = this.controller.yaw;
    const fx = -Math.sin(yaw);
    const fy = -Math.cos(yaw);
    const px = -fy;
    const py = fx;
    const tipX = cx + fx * size;
    const tipY = cy + fy * size;
    const backX = cx - fx * size * 0.45;
    const backY = cy - fy * size * 0.45;
    const wing = size * 0.55;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(backX + px * wing, backY + py * wing);
    ctx.lineTo(backX - px * wing, backY - py * wing);
    ctx.closePath();
    ctx.fillStyle = '#f7fafc';
    ctx.fill();
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private toggleMap(force?: boolean): void {
    if (this.paused || this.awaitingUpgrade || this.wiping || this.runEnding) return;
    this.mapOpen = force ?? !this.mapOpen;
    if (this.mapOpen) {
      this.releasePointerLock();
      this.renderFullMap();
      this.mapOverlay.classList.add('show');
    } else {
      this.mapOverlay.classList.remove('show');
      this.mapOverlay.replaceChildren();
      this.renderer.domElement.requestPointerLock();
    }
  }

  private renderFullMap(): void {
    this.mapOverlay.replaceChildren();
    this.mapOverlay.append(
      el('h2', undefined, 'DUNGEON MAP'),
      el('p', undefined, 'You · Cleared · Fog · Mini-boss · Boss  |  M / Esc close'),
    );
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    this.mapOverlay.appendChild(canvas);
    const tip = el('p', undefined, 'Press M or Esc to close');
    this.mapOverlay.appendChild(tip);

    const run = getRun();
    const visited = new Set(run.visitedRoomIds);
    const fogged = new Set<string>();
    for (const id of visited) {
      const room = run.dungeon.rooms[id];
      if (!room) continue;
      for (const next of Object.values(room.connections)) {
        if (next && !visited.has(next)) fogged.add(next);
      }
    }
    const rooms = Object.values(run.dungeon.rooms).filter(
      (r) => visited.has(r.id) || fogged.has(r.id),
    );
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (rooms.length === 0) return;
    const minX = Math.min(...rooms.map((r) => r.x));
    const maxX = Math.max(...rooms.map((r) => r.x));
    const minY = Math.min(...rooms.map((r) => r.y));
    const maxY = Math.max(...rooms.map((r) => r.y));
    const cell = 28;
    const gap = 6;
    const mapW = (maxX - minX + 1) * (cell + gap);
    const mapH = (maxY - minY + 1) * (cell + gap);
    const ox = (canvas.width - mapW) / 2;
    const oy = (canvas.height - mapH) / 2;
    for (const r of rooms) {
      const fog = fogged.has(r.id) && !visited.has(r.id);
      const cur = r.id === run.currentRoomId;
      const dim = r.sectionIndex < run.currentSectionIndex ? 0.55 : 1;
      const px = ox + (r.x - minX) * (cell + gap);
      const py = oy + (r.y - minY) * (cell + gap);
      ctx.globalAlpha = (fog ? 0.4 : 1) * dim;
      ctx.fillStyle = cur
        ? '#63b3ed'
        : fog
          ? '#4a5568'
          : r.cleared
            ? '#276749'
            : r.type === 'boss'
              ? '#9f7aea'
              : r.type === 'miniBoss'
                ? '#ed8936'
                : '#2d3748';
      ctx.fillRect(px, py, cell, cell);
      if (cur) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, cell, cell);
        this.drawFacingMarker(ctx, px + cell / 2, py + cell / 2, cell * 0.38);
      }
      if (!fog) {
        const label =
          r.type === 'boss'
            ? 'B'
            : r.type === 'miniBoss'
              ? 'M'
              : r.type === 'start'
                ? 'S'
                : '';
        if (label) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, px + cell / 2, py + cell / 2);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  private openPause(): void {
    if (this.paused || this.awaitingUpgrade || this.wiping || this.runEnding) return;
    if (this.mapOpen) this.toggleMap(false);

    this.paused = true;
    this.pauseArmed = false;
    this.pauseOpenedAt = performance.now();
    this.input.clearFire();
    this.releasePointerLock();

    this.pauseOverlay.replaceChildren();
    this.pauseOverlay.classList.remove('armed');
    this.pauseOverlay.classList.add('disarmed');

    const panel = el('div', 'upgrade-panel');
    panel.append(el('h2', 'upgrade-title', 'PAUSED'));
    panel.append(el('div', 'upgrade-rule'));

    const opts = el('div', 'upgrade-opts');
    const addOpt = (
      label: string,
      action: () => void,
      muted = false,
    ): void => {
      const btn = el('button', muted ? 'upgrade-opt muted-opt' : 'upgrade-opt');
      btn.type = 'button';
      btn.disabled = true;
      const line = el('div');
      line.append(el('span', 'opt-name', label));
      btn.appendChild(line);

      let pressed = false;
      btn.addEventListener('pointerdown', (ev) => {
        if (!this.pauseArmed || ev.button !== 0) return;
        pressed = true;
      });
      btn.addEventListener('pointerup', (ev) => {
        if (!this.pauseArmed || ev.button !== 0 || !pressed) return;
        pressed = false;
        action();
      });
      btn.addEventListener('pointerleave', () => {
        pressed = false;
      });
      opts.appendChild(btn);
    };

    addOpt('[ RESUME ]', () => this.closePause(true));
    addOpt('[ QUIT TO META HUB ]', () => this.abandonRun('hub'), true);
    addOpt('[ QUIT TO MENU ]', () => this.abandonRun('menu'), true);
    panel.appendChild(opts);

    const hint = el('p', 'upgrade-hint', 'GET READY…');
    hint.id = 'pause-hint';
    panel.appendChild(hint);
    this.pauseOverlay.appendChild(panel);
    this.pauseOverlay.classList.add('show');

    if (this.pauseArmTimer !== null) clearTimeout(this.pauseArmTimer);
    this.pauseArmTimer = setTimeout(() => this.armPause(), 300);
  }

  private armPause(): void {
    if (!this.paused || this.pauseArmed) return;
    this.pauseArmed = true;
    this.pauseOverlay.classList.remove('disarmed');
    this.pauseOverlay.classList.add('armed');
    const hint = this.pauseOverlay.querySelector('#pause-hint');
    if (hint) hint.textContent = 'ESC TO RESUME';
    this.pauseOverlay
      .querySelectorAll<HTMLButtonElement>('.upgrade-opt')
      .forEach((btn) => {
        btn.disabled = false;
      });
  }

  private closePause(relock: boolean): void {
    if (this.pauseArmTimer !== null) {
      clearTimeout(this.pauseArmTimer);
      this.pauseArmTimer = null;
    }
    this.paused = false;
    this.pauseArmed = false;
    this.pauseOverlay.classList.remove('show', 'armed', 'disarmed');
    this.pauseOverlay.replaceChildren();
    if (relock && this.screen === 'run') {
      this.renderer.domElement.requestPointerLock();
    }
  }

  private abandonRun(dest: 'hub' | 'menu'): void {
    this.closePause(false);
    this.closeUpgradeUi();
    this.awaitingUpgrade = false;
    this.mapOpen = false;
    this.mapOverlay.classList.remove('show');
    this.mapOverlay.replaceChildren();
    this.clearWorld();
    this.hideRunUi();
    if (dest === 'hub') this.showHub();
    else this.showMenu();
  }

  private openUpgrade(): void {
    this.closeUpgradeUi();
    this.awaitingUpgrade = true;
    this.upgradeArmed = false;
    this.upgradeArmReady = false;
    this.upgradeBlockUntilRelease = this.input.fireHeld;
    this.input.clearFire();
    this.releasePointerLock();

    const run = getRun();
    const ids = rollUpgradeChoices(
      run.seed,
      run.roomsCleared,
      RUN_UPGRADES,
      3,
    ) as UpgradeId[];
    this.upgradeChoices = ids;

    this.upgradeOverlay.replaceChildren();
    this.upgradeOverlay.classList.remove('armed');
    this.upgradeOverlay.classList.add('disarmed');

    const panel = el('div', 'upgrade-panel');
    panel.append(el('h2', 'upgrade-title', 'CHOOSE AN UPGRADE'));
    panel.append(el('div', 'upgrade-rule'));

    const opts = el('div', 'upgrade-opts');
    ids.forEach((id, i) => {
      const def = RUN_UPGRADES.find((u) => u.id === id)!;
      const btn = el('button', 'upgrade-opt');
      btn.type = 'button';
      btn.disabled = true;
      btn.dataset.upgradeId = id;

      const line = el('div');
      const key = el('span', 'opt-key', `[${i + 1}] `);
      const rarity = el(
        'span',
        `opt-rarity rarity-${def.rarity}`,
        RARITY_LABEL[def.rarity] ?? def.rarity.toUpperCase(),
      );
      const name = el('span', 'opt-name', ` ${def.name}`);
      line.append(key, rarity, name);
      btn.append(line, el('div', 'opt-desc', def.description));

      let pressed = false;
      btn.addEventListener('pointerdown', (ev) => {
        if (!this.upgradeArmed || ev.button !== 0) return;
        pressed = true;
      });
      btn.addEventListener('pointerup', (ev) => {
        if (!this.upgradeArmed || ev.button !== 0 || !pressed) return;
        pressed = false;
        this.pickUpgrade(id);
      });
      btn.addEventListener('pointerleave', () => {
        pressed = false;
      });

      opts.appendChild(btn);
    });
    panel.appendChild(opts);

    const hint = el(
      'p',
      'upgrade-hint',
      this.upgradeBlockUntilRelease
        ? 'RELEASE TO CHOOSE…'
        : 'GET READY…',
    );
    hint.id = 'upgrade-hint';
    panel.appendChild(hint);
    this.upgradeOverlay.appendChild(panel);
    this.upgradeOverlay.classList.add('show');

    window.addEventListener('keydown', this.onUpgradeKey);
    window.addEventListener('mouseup', this.onUpgradeMouseUp);

    this.upgradeArmTimer = setTimeout(() => {
      this.upgradeArmReady = true;
      this.tryArmUpgrade();
    }, 450);
  }

  private tryArmUpgrade(): void {
    if (!this.awaitingUpgrade || this.upgradeArmed) return;
    if (!this.upgradeArmReady || this.upgradeBlockUntilRelease) return;

    this.upgradeArmed = true;
    this.upgradeOverlay.classList.remove('disarmed');
    this.upgradeOverlay.classList.add('armed');

    const hint = this.upgradeOverlay.querySelector('#upgrade-hint');
    if (hint) hint.textContent = 'PRESS 1–3 · CLICK WHEN READY';

    this.upgradeOverlay
      .querySelectorAll<HTMLButtonElement>('.upgrade-opt')
      .forEach((btn) => {
        btn.disabled = false;
      });
  }

  private onUpgradeKey = (ev: KeyboardEvent): void => {
    if (!this.awaitingUpgrade || !this.upgradeArmed) return;
    const n = Number(ev.key);
    if (n < 1 || n > this.upgradeChoices.length) return;
    const id = this.upgradeChoices[n - 1];
    if (id) this.pickUpgrade(id);
  };

  private onUpgradeMouseUp = (ev: MouseEvent): void => {
    if (ev.button !== 0) return;
    this.upgradeBlockUntilRelease = false;
    this.tryArmUpgrade();
  };

  private closeUpgradeUi(): void {
    if (this.upgradeArmTimer !== null) {
      clearTimeout(this.upgradeArmTimer);
      this.upgradeArmTimer = null;
    }
    window.removeEventListener('keydown', this.onUpgradeKey);
    window.removeEventListener('mouseup', this.onUpgradeMouseUp);
    this.upgradeArmed = false;
    this.upgradeArmReady = false;
    this.upgradeBlockUntilRelease = false;
    this.upgradeChoices = [];
    this.upgradeOverlay.classList.remove('show', 'armed', 'disarmed');
    this.upgradeOverlay.replaceChildren();
  }

  private pickUpgrade(id: UpgradeId): void {
    if (!this.awaitingUpgrade || !this.upgradeArmed) return;
    applyRunUpgrade(id);
    this.closeUpgradeUi();
    this.awaitingUpgrade = false;
    this.doorsLocked = false;
    if (this.built) setDoorsLocked(this.built.doors, false);
    this.refreshHud();
    this.renderer.domElement.requestPointerLock();
  }

  private checkRoomClear(): void {
    if (this.runEnding || !this.built) return;
    if (this.enemies.aliveCount() > 0) return;
    const run = getRun();
    const room = run.dungeon.rooms[run.currentRoomId]!;
    if (room.cleared) return;
    markRoomCleared(room.id);
    this.refreshHud();
    if (room.type === 'boss') {
      this.endRun(true);
      return;
    }
    if (room.type === 'combat' || room.type === 'miniBoss') {
      if (rollUpgradeOffer(run.seed, run.roomsCleared, UPGRADE_OFFER_CHANCE)) {
        this.openUpgrade();
        return;
      }
    }
    this.doorsLocked = false;
    setDoorsLocked(this.built.doors, false);
    this.renderer.domElement.requestPointerLock();
  }

  private tryTravel(door: DoorTrigger): void {
    if (this.doorsLocked || this.awaitingUpgrade || this.wiping) return;
    if (this.clock < this.travelLockUntil) return;
    const run = getRun();
    const room = run.dungeon.rooms[run.currentRoomId]!;
    const nextId = room.connections[door.dir];
    if (!nextId) return;
    const next = run.dungeon.rooms[nextId]!;
    run.enteredFrom = OPPOSITE[door.dir];
    const sectionChange =
      room.type === 'miniBoss' &&
      room.cleared &&
      next.sectionIndex > room.sectionIndex;

    if (sectionChange) {
      void this.irisWipe(() => this.loadRoom(nextId));
    } else {
      this.loadRoom(nextId);
    }
  }

  private async irisWipe(mid: () => void): Promise<void> {
    this.wiping = true;
    this.releasePointerLock();
    this.iris.style.display = 'block';
    const top = this.iris.querySelector('.top') as HTMLElement;
    const bottom = this.iris.querySelector('.bottom') as HTMLElement;
    const left = this.iris.querySelector('.left') as HTMLElement;
    const right = this.iris.querySelector('.right') as HTMLElement;
    const halfH = window.innerHeight / 2 + 2;
    const halfW = window.innerWidth / 2 + 2;
    const animate = (
      el: HTMLElement,
      prop: 'height' | 'width',
      to: number,
      ms: number,
    ) =>
      new Promise<void>((resolve) => {
        el.style.transition = `${prop} ${ms}ms ease-in`;
        requestAnimationFrame(() => {
          el.style[prop] = `${to}px`;
        });
        setTimeout(resolve, ms);
      });
    await Promise.all([
      animate(top, 'height', halfH, 280),
      animate(bottom, 'height', halfH, 280),
      animate(left, 'width', halfW, 280),
      animate(right, 'width', halfW, 280),
    ]);
    mid();
    const open = (
      el: HTMLElement,
      prop: 'height' | 'width',
      ms: number,
    ) =>
      new Promise<void>((resolve) => {
        el.style.transition = `${prop} ${ms}ms ease-out`;
        requestAnimationFrame(() => {
          el.style[prop] = '0px';
        });
        setTimeout(resolve, ms);
      });
    await Promise.all([
      open(top, 'height', 280),
      open(bottom, 'height', 280),
      open(left, 'width', 280),
      open(right, 'width', 280),
    ]);
    this.iris.style.display = 'none';
    this.wiping = false;
    this.renderer.domElement.requestPointerLock();
  }

  private takeHit(amount: number): void {
    if (this.clock < this.iFrameUntil) return;
    const run = getRun();
    run.hp = Math.max(0, run.hp - amount);
    this.iFrameUntil = this.clock + BASE_STATS.iFrameMs;
    this.refreshHud();
    if (run.hp <= 0) this.endRun(false);
  }

  private endRun(won: boolean): void {
    if (this.runEnding) return;
    this.runEnding = true;
    if (!won) markPlayerDead();
    else getRun().won = true;

    let meta = getMeta();
    meta = addCurrency(meta, getRun().currencyEarned);
    setMeta(meta);
    saveMeta(meta);

    this.hideRunUi();
    this.clearWorld();
    this.screen = 'results';
    this.clearPanel();
    const run = getRun();
    const panel = el('div', 'panel');
    panel.append(
      el('h1', undefined, won ? 'VICTORY' : 'DEFEATED'),
      el(
        'p',
        undefined,
        `Rooms cleared: ${run.roomsCleared} · Currency +${run.currencyEarned} · Total ${getMeta().currency}`,
      ),
    );
    const btn = el('button', undefined, '[ CONTINUE TO META HUB ]');
    btn.onclick = () => this.showHub();
    panel.append(btn);
    this.panelHost.appendChild(panel);
  }

  private frame = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.clock = now;

    const pointerLocked =
      document.pointerLockElement === this.renderer.domElement;

    if (this.screen === 'run' && !this.mapOpen && !this.awaitingUpgrade && !this.paused && !this.wiping && !this.runEnding) {
      this.clickTip.style.display = pointerLocked ? 'none' : 'block';
      const run = getRun();
      this.controller.update(dt, this.input, run.moveSpeed, pointerLocked);

      if (pointerLocked && this.built) {
        this.enemies.update(
          dt,
          now,
          this.controller.x,
          this.controller.z,
          this.built.colliders,
          this.projectiles,
          this.controller.camera,
        );
        this.projectiles.update(
          dt,
          this.built.colliders,
          this.built.width / 2 + 1,
          this.built.depth / 2 + 1,
        );

        // Player fire + timed reload
        const weapon = getWeapon(run.weaponId);
        const ammoSnap = {
          mag: run.mag,
          reserve: run.reserve,
          maxMag: run.maxMag,
          maxReserve: run.maxReserve,
        };

        if (this.reloading && now >= this.reloadEndsAt) {
          const reloaded = reloadAmmo(ammoSnap);
          run.mag = reloaded.mag;
          run.reserve = reloaded.reserve;
          this.cancelReload();
          this.refreshHud();
        }

        const reloadDown = this.input.keys.has('KeyR');
        if (
          reloadDown &&
          !this.reloadWasDown &&
          !this.reloading &&
          canReload(ammoSnap)
        ) {
          this.reloading = true;
          this.reloadEndsAt = now + weapon.reloadMs;
          this.refreshHud();
        }
        this.reloadWasDown = reloadDown;

        if (
          this.input.fireHeld &&
          !this.reloading &&
          now >= this.fireTimer
        ) {
          const spent = trySpendAmmo(
            {
              mag: run.mag,
              reserve: run.reserve,
              maxMag: run.maxMag,
              maxReserve: run.maxReserve,
            },
            1,
          );
          if (spent) {
            run.mag = spent.mag;
            run.reserve = spent.reserve;
            this.fireTimer = now + run.fireCooldownMs;
            const origin = this.controller.camera.position.clone();
            const forward = this.controller.forward();
            for (let i = 0; i < weapon.pelletCount; i++) {
              const spread = aimWithSpread(
                forward,
                weapon.spreadDeg * (run.spreadMult ?? 1),
              );
              const dir = new THREE.Vector3(spread.x, spread.y, spread.z);
              this.projectiles.spawn(
                origin,
                dir,
                weapon.bulletSpeed,
                run.damage,
                run.pierce,
                true,
                !!run.ricochet,
              );
            }
            this.refreshHud();
          }
        }

        // Walk-over Ammo pickups
        for (const pickup of this.ammoPickups) {
          if (!pickup.alive) continue;
          const dx = this.controller.x - pickup.mesh.position.x;
          const dz = this.controller.z - pickup.mesh.position.z;
          if (dx * dx + dz * dz < 0.7 * 0.7) {
            const next = applyAmmoPickup(
              {
                mag: run.mag,
                reserve: run.reserve,
                maxMag: run.maxMag,
                maxReserve: run.maxReserve,
              },
              pickup.amount,
            );
            if (
              next.mag !== run.mag ||
              next.reserve !== run.reserve
            ) {
              run.mag = next.mag;
              run.reserve = next.reserve;
              pickup.alive = false;
              this.scene.remove(pickup.mesh);
              pickup.mesh.geometry.dispose();
              (pickup.mesh.material as THREE.Material).dispose();
              this.refreshHud();
            }
          }
        }

        // Projectile vs enemies / player
        for (const p of this.projectiles.list) {
          if (!p.alive) continue;
          if (p.fromPlayer) {
            for (const e of this.enemies.list) {
              if (!e.alive || p.hitIds.has(e.id)) continue;
              const dx = p.mesh.position.x - e.mesh.position.x;
              const dz = p.mesh.position.z - e.mesh.position.z;
              if (dx * dx + dz * dz < 0.55 * 0.55) {
                p.hitIds.add(e.id);
                const dead = this.enemies.hurt(e, p.damage);
                if (p.pierceLeft <= 0) this.projectiles.kill(p);
                else p.pierceLeft -= 1;
                if (dead) {
                  if (run.lifesteal) {
                    run.hp = Math.min(run.maxHp, run.hp + 1);
                    this.refreshHud();
                  }
                  this.checkRoomClear();
                }
                break;
              }
            }
          } else {
            const dx = p.mesh.position.x - this.controller.x;
            const dz = p.mesh.position.z - this.controller.z;
            if (dx * dx + dz * dz < (PLAYER_RADIUS + 0.15) ** 2) {
              this.projectiles.kill(p);
              this.takeHit(p.damage);
            }
          }
        }

        // Contact damage
        for (const e of this.enemies.list) {
          if (!e.alive) continue;
          const dx = e.mesh.position.x - this.controller.x;
          const dz = e.mesh.position.z - this.controller.z;
          const r =
            e.kind === 'boss' ? 0.9 : e.kind === 'tank' || e.kind === 'miniBoss' ? 0.75 : 0.65;
          if (dx * dx + dz * dz < r * r) {
            this.takeHit(e.contactDamage);
          }
        }

        // Door triggers
        if (!this.doorsLocked) {
          for (const door of this.built.doors) {
            if (
              circleHitsAabb(
                this.controller.x,
                this.controller.z,
                PLAYER_RADIUS,
                door.aabb,
              )
            ) {
              this.tryTravel(door);
              break;
            }
          }
        }
      }
    }

    this.input.endFrame();
    if (this.screen === 'run') this.drawMinimap();
    this.renderer.render(this.scene, this.controller.camera);
    requestAnimationFrame(this.frame);
  };
}
