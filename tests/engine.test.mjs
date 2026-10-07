import test from "node:test";
import assert from "node:assert/strict";
import { Game, SHAPES } from "../dist/engine.mjs";
const game = () => {
  const g = new Game(() => 0.42);
  g.start();
  return g;
};
const piece = (type, x, y) => ({
  type,
  x,
  y,
  matrix: SHAPES[type].map((r) => [...r]),
});
test("walls, floor and occupied cells reject collisions", () => {
  const g = game();
  assert.equal(g.fits(piece("O", -1, 0)), false);
  assert.equal(g.fits(piece("O", 9, 0)), false);
  assert.equal(g.fits(piece("O", 0, 19)), false);
  g.board[1][1] = "T";
  assert.equal(g.fits(piece("O", 0, 0)), false);
  assert.equal(g.fits(piece("O", 3, -1)), true);
});
test("successive seven bags contain each piece exactly once", () => {
  const g = new Game(() => 0.42);
  const seen = [];
  for (let i = 0; i < 21; i++) {
    g.spawn();
    seen.push(g.active.type);
  }
  for (let i = 0; i < 21; i += 7)
    assert.deepEqual(
      [...seen.slice(i, i + 7)].sort(),
      Object.keys(SHAPES).sort(),
    );
});
test("ghost and hard drop agree, award distance and lock only one piece", () => {
  const g = game();
  g.active = piece("O", 4, 0);
  const ghost = g.ghost();
  assert.equal(ghost.y, 18);
  g.drop();
  assert.equal(g.score, 36);
  assert.equal(g.board.flat().filter(Boolean).length, 4);
  for (const y of [18, 19])
    for (const x of [4, 5]) assert.equal(g.board[y][x], "O");
  assert.equal(g.active.y <= 0, true);
});
test("four-line clear scores at prior level then increases level", () => {
  const g = game();
  g.lines = 8;
  g.active = { type: "I", x: 0, y: 16, matrix: [[1], [1], [1], [1]] };
  for (let y = 16; y < 20; y++) g.board[y] = [null, ...Array(9).fill("T")];
  g.lock();
  assert.equal(g.clearTime, 140);
  assert.equal(g.active, null);
  assert.equal(g.score, 0);
  g.update(100);
  assert.equal(g.lines, 8);
  g.update(40);
  assert.equal(g.score, 800);
  assert.equal(g.lines, 12);
  assert.equal(g.level, 2);
  assert.equal(g.board.flat().filter(Boolean).length, 0);
});
test("clear barrier blocks movement, rotation, soft and hard drop; pause freezes it", () => {
  const g = game();
  g.active = piece("O", 4, 18);
  for (const y of [18, 19])
    g.board[y] = Array.from({ length: 10 }, (_, x) =>
      x === 4 || x === 5 ? null : "T",
    );
  g.lock();
  const before = JSON.stringify(g);
  assert.equal(g.move(1), false);
  assert.equal(g.rotate(), false);
  assert.equal(g.step(true), false);
  g.drop();
  assert.equal(JSON.stringify(g), before);
  g.pause();
  const remaining = g.clearTime;
  g.update(100);
  assert.equal(g.clearTime, remaining);
  g.pause();
  g.update(100);
  g.update(40);
  assert.equal(g.lines, 2);
});
test("pause freezes all engine timing and restart clears progress", () => {
  const g = game();
  g.step(true);
  g.pause();
  const before = JSON.stringify(g);
  g.update(100);
  g.drop();
  g.move(1);
  assert.equal(JSON.stringify(g), before);
  g.start();
  assert.equal(g.state, "playing");
  assert.equal(g.score, 0);
  assert.equal(g.lines, 0);
  assert.equal(g.level, 1);
  assert.equal(g.board.flat().filter(Boolean).length, 0);
  assert.equal(g.lockTime, 0);
});
test("spawn collision and locked cells above ceiling cause game over", () => {
  const g = game();
  g.board[0].fill("T");
  g.spawn();
  assert.equal(g.state, "over");
  const h = game();
  h.active = piece("O", 4, -1);
  h.lock();
  assert.equal(h.state, "over");
  assert.equal(h.board.length, 20);
});
test("failed rotation leaves active piece unchanged", () => {
  const g = game();
  g.board = g.board.map((r) => r.map(() => "O"));
  g.active = piece("T", 4, 8);
  g.active.matrix.forEach((r, y) =>
    r.forEach((v, x) => {
      if (v) g.board[8 + y][4 + x] = null;
    }),
  );
  const before = structuredClone(g.active);
  assert.equal(g.rotate(), false);
  assert.deepEqual(g.active, before);
});
test("failed movement does not reset lock and grounded lock expires", () => {
  const g = game();
  g.active = piece("O", 0, 18);
  g.lockTime = 400;
  assert.equal(g.move(-1), false);
  assert.equal(g.lockTime, 400);
  g.update(100);
  assert.equal(g.board.flat().filter(Boolean).length, 4);
});
test("only fifteen successful grounded moves reset lock deadline", () => {
  const g = game();
  g.active = piece("O", 4, 18);
  for (let i = 0; i < 15; i++) {
    g.lockTime = 400;
    assert.equal(g.move(i % 2 ? -1 : 1), true);
    assert.equal(g.lockTime, 0);
  }
  assert.equal(g.resets, 15);
  g.lockTime = 450;
  assert.equal(g.move(-1), true);
  assert.equal(g.lockTime, 450);
  g.update(50);
  assert.equal(g.board.flat().filter(Boolean).length, 4);
});
test("long frame delta is bounded", () => {
  const g = game();
  const y = g.active.y;
  g.update(60000);
  assert.equal(g.gravity, 100);
  assert.equal(g.active.y, y);
});
