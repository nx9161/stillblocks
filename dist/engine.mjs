export const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};
export class Game {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }
  reset() {
    this.board = Array.from({ length: 20 }, () => Array(10).fill(null));
    this.queue = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.state = "ready";
    this.active = null;
    this.gravity = 0;
    this.lockTime = 0;
    this.resets = 0;
    this.cleared = [];
    this.clearTime = 0;
    this.refill();
  }
  refill() {
    while (this.queue.length < 7) {
      const bag = Object.keys(SHAPES);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.queue.push(...bag);
    }
  }
  start() {
    this.reset();
    this.state = "playing";
    this.spawn();
  }
  spawn() {
    this.refill();
    const type = this.queue.shift();
    const matrix = SHAPES[type].map((r) => [...r]);
    this.active = {
      type,
      matrix,
      x: Math.floor((10 - matrix.length) / 2),
      y: type === "I" ? -1 : 0,
    };
    this.gravity = 0;
    this.lockTime = 0;
    this.resets = 0;
    if (!this.fits(this.active)) {
      this.state = "over";
    }
  }
  fits(p) {
    return p.matrix.every((r, y) =>
      r.every(
        (v, x) =>
          !v ||
          (p.x + x >= 0 &&
            p.x + x < 10 &&
            p.y + y < 20 &&
            (p.y + y < 0 || !this.board[p.y + y][p.x + x])),
      ),
    );
  }
  grounded() {
    return !this.fits({ ...this.active, y: this.active.y + 1 });
  }
  adjustLock(wasGrounded) {
    if (wasGrounded && this.resets < 15) {
      this.lockTime = 0;
      this.resets++;
    }
  }
  move(dx) {
    if (this.state !== "playing" || this.clearTime) return false;
    const grounded = this.grounded();
    const p = { ...this.active, x: this.active.x + dx };
    if (!this.fits(p)) return false;
    this.active = p;
    this.adjustLock(grounded);
    return true;
  }
  rotate(dir = 1) {
    if (this.state !== "playing" || this.clearTime || this.active.type === "O")
      return false;
    const a = this.active;
    const n = a.matrix.length;
    const matrix = Array.from({ length: n }, (_, y) =>
      Array.from({ length: n }, (_, x) =>
        dir === 1 ? a.matrix[n - 1 - x][y] : a.matrix[x][n - 1 - y],
      ),
    );
    const wasGrounded = this.grounded();
    for (const [dx, dy] of [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
      [0, -1],
      [-1, -1],
      [1, -1],
      [0, -2],
    ]) {
      const p = { ...a, matrix, x: a.x + dx, y: a.y + dy };
      if (this.fits(p)) {
        this.active = p;
        this.adjustLock(wasGrounded);
        return true;
      }
    }
    return false;
  }
  step(soft = false) {
    if (this.state !== "playing" || this.clearTime) return false;
    const p = { ...this.active, y: this.active.y + 1 };
    if (!this.fits(p)) return false;
    this.active = p;
    if (soft) this.score++;
    return true;
  }
  ghost() {
    let p = { ...this.active };
    while (this.fits({ ...p, y: p.y + 1 })) p.y++;
    return p;
  }
  drop() {
    if (this.state !== "playing" || this.clearTime) return;
    const p = this.ghost();
    this.score += (p.y - this.active.y) * 2;
    this.active = p;
    this.lock();
  }
  lock() {
    let above = false;
    this.active.matrix.forEach((r, y) =>
      r.forEach((v, x) => {
        if (v) {
          const yy = this.active.y + y;
          if (yy < 0) above = true;
          else this.board[yy][this.active.x + x] = this.active.type;
        }
      }),
    );
    if (above) {
      this.state = "over";
      return;
    }
    this.cleared = this.board.flatMap((r, i) => (r.every(Boolean) ? [i] : []));
    if (this.cleared.length) {
      this.clearTime = 140;
      this.active = null;
    } else this.spawn();
  }
  finishClear() {
    const n = this.cleared.length;
    this.board = this.board.filter((_, i) => !this.cleared.includes(i));
    while (this.board.length < 20) this.board.unshift(Array(10).fill(null));
    this.score += [0, 100, 300, 500, 800][n] * this.level;
    this.lines += n;
    this.level = 1 + Math.floor(this.lines / 10);
    this.cleared = [];
    this.clearTime = 0;
    this.spawn();
  }
  update(dt) {
    if (this.state !== "playing") return;
    dt = Math.min(dt, 100);
    if (this.clearTime) {
      this.clearTime -= dt;
      if (this.clearTime <= 0) this.finishClear();
      return;
    }
    this.gravity += dt;
    const interval = Math.max(85, 850 * Math.pow(0.8, this.level - 1));
    while (this.gravity >= interval) {
      this.gravity -= interval;
      if (!this.step()) break;
    }
    if (this.grounded()) {
      this.lockTime += dt;
      if (this.lockTime >= 500) this.lock();
    } else this.lockTime = 0;
  }
  pause() {
    if (this.state === "playing") this.state = "paused";
    else if (this.state === "paused") this.state = "playing";
  }
}
