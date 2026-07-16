export class Input {
  readonly keys = new Set<string>();
  mouseDX = 0;
  mouseDY = 0;
  fireHeld = false;
  private canvas: HTMLElement;
  /** Ignore look deltas briefly after lock (browser often emits a huge first jump). */
  private ignoreLookUntil = 0;

  constructor(canvas: HTMLElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    canvas.addEventListener('click', () => {
      if (document.pointerLockElement === canvas) return;
      // GameApp opens pause on unexpected unlock; don't fight overlays.
      if (document.getElementById('pause-overlay')?.classList.contains('show')) {
        return;
      }
      if (document.getElementById('upgrade-overlay')?.classList.contains('show')) {
        return;
      }
      if (document.getElementById('shop-overlay')?.classList.contains('show')) {
        return;
      }
      if (document.getElementById('map-overlay')?.classList.contains('show')) {
        return;
      }
      canvas.requestPointerLock();
    });
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }

  endFrame(): void {
    this.mouseDX = 0;
    this.mouseDY = 0;
  }

  clearFire(): void {
    this.fireHeld = false;
  }

  private onPointerLockChange = (): void => {
    if (document.pointerLockElement === this.canvas) {
      this.mouseDX = 0;
      this.mouseDY = 0;
      this.ignoreLookUntil = performance.now() + 80;
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.canvas) return;
    if (performance.now() < this.ignoreLookUntil) return;

    // Chromium occasionally reports huge spurious deltas while locked.
    const maxX = window.innerWidth / 3;
    const maxY = window.innerHeight / 3;
    if (Math.abs(e.movementX) > maxX || Math.abs(e.movementY) > maxY) return;

    this.mouseDX += e.movementX;
    this.mouseDY += e.movementY;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) this.fireHeld = true;
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.fireHeld = false;
  };
}
