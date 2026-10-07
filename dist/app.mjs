import { Game, SHAPES } from "./engine.mjs";
const $ = (id) => document.getElementById(id);
const game = new Game();
const canvas = $("board"),
  ctx = canvas.getContext("2d"),
  next = $("next"),
  nx = next.getContext("2d");
const COLORS = {
  I: "#648f96",
  O: "#caa356",
  T: "#9682a6",
  S: "#83977a",
  Z: "#c27665",
  J: "#7a8eac",
  L: "#c28f59",
};
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let last = 0,
  previousState = "",
  previousLines = 0,
  held = new Map(),
  repeatClock = 0,
  confirming = false,
  scoreSnapshot = -1;
const announce = (text) => {
  $("announcement").textContent = text;
};
function block(c, x, y, size, type, ghost = false) {
  const gap = size * 0.055;
  c.save();
  if (ghost) {
    c.strokeStyle = "#817766";
    c.lineWidth = 1.6;
    c.setLineDash([5, 3]);
    c.strokeRect(
      x + gap + 1,
      y + gap + 1,
      size - gap * 2 - 2,
      size - gap * 2 - 2,
    );
  } else {
    c.fillStyle = COLORS[type];
    c.beginPath();
    c.roundRect(x + gap, y + gap, size - gap * 2, size - gap * 2, size * 0.11);
    c.fill();
    c.fillStyle = "#ffffff22";
    c.fillRect(x + gap + 3, y + gap + 3, size - gap * 2 - 6, 3);
  }
  c.restore();
}
function drawPiece(c, p, size, ghost = false) {
  p.matrix.forEach((r, y) =>
    r.forEach((v, x) => {
      if (v && p.y + y >= 0)
        block(c, (p.x + x) * size, (p.y + y) * size, size, p.type, ghost);
    }),
  );
}
function draw() {
  const s = canvas.width / 10;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ece7df";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#d9d1c455";
  ctx.lineWidth = 1;
  for (let x = 1; x < 10; x++) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0);
    ctx.lineTo(x * s, canvas.height);
    ctx.stroke();
  }
  for (let y = 1; y < 20; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * s);
    ctx.lineTo(canvas.width, y * s);
    ctx.stroke();
  }
  game.board.forEach((r, y) =>
    r.forEach((t, x) => {
      if (t) block(ctx, x * s, y * s, s, t);
    }),
  );
  if (game.active) {
    drawPiece(ctx, game.ghost(), s, true);
    drawPiece(ctx, game.active, s);
  }
  if (game.cleared.length) {
    ctx.fillStyle = reduced.matches
      ? "#f5f1ea88"
      : `rgba(245,241,234,${0.3 + game.clearTime / 200})`;
    game.cleared.forEach((y) => ctx.fillRect(0, y * s, canvas.width, s));
  }
  nx.clearRect(0, 0, next.width, next.height);
  game.queue.slice(0, 3).forEach((type, i) => {
    const matrix = SHAPES[type],
      ss = i === 0 ? 44 : 33;
    const cells = [];
    matrix.forEach((r, y) =>
      r.forEach((v, x) => {
        if (v) cells.push([x, y]);
      }),
    );
    const minX = Math.min(...cells.map((c) => c[0])),
      maxX = Math.max(...cells.map((c) => c[0])),
      minY = Math.min(...cells.map((c) => c[1]));
    const startX = (next.width - (maxX - minX + 1) * ss) / 2;
    nx.globalAlpha = i === 0 ? 1 : 0.6;
    cells.forEach(([x, y]) =>
      block(
        nx,
        startX + (x - minX) * ss,
        18 + i * 116 + (y - minY) * ss,
        ss,
        type,
      ),
    );
  });
  nx.globalAlpha = 1;
  next.setAttribute(
    "aria-label",
    `Next pieces: ${game.queue.slice(0, 3).join(", ")}`,
  );
}
function ui() {
  if (scoreSnapshot !== game.score) {
    $("score").textContent = String(game.score).padStart(5, "0");
    scoreSnapshot = game.score;
  }
  $("level").textContent = String(game.level).padStart(2, "0");
  $("lines").textContent = String(game.lines).padStart(2, "0");
  const state = confirming ? "confirm" : game.state;
  if (state !== previousState) {
    previousState = state;
    held.clear();
    last = 0;
    $("overlay").hidden = state === "playing";
    $("pause").disabled =
      state === "ready" || state === "over" || state === "confirm";
    $("pause").innerHTML =
      state === "paused" ? "Resume <kbd>P</kbd>" : "Pause <kbd>P</kbd>";
    $("state-label").textContent = {
      ready: "READY WHEN YOU ARE",
      playing: "FIND YOUR FLOW",
      paused: "A MOMENT TO BREATHE",
      over: "ANOTHER ROUND?",
      confirm: "A FRESH START?",
    }[state];
    const info = {
      ready: [
        "Find your rhythm.",
        "Make space. Clear lines.\nSee how far you can go.",
        "Let’s play",
        "A keyboard is all you need.",
        "✳",
      ],
      paused: [
        "Take a breath.",
        "Your blocks will wait for you.",
        "Keep going",
        "Press P, Esc, or Enter to resume.",
        "Ⅱ",
      ],
      over: [
        "A lovely little run.",
        `${game.score.toLocaleString()} points · ${game.lines} lines cleared`,
        "Play again",
        "Press Enter for another round.",
        "✧",
      ],
      confirm: [
        "Start fresh?",
        "This round’s progress will be reset.",
        "Start fresh",
        "Enter to restart · Esc to keep this round",
        "↺",
      ],
    }[state];
    if (info) {
      $("overlay-title").textContent = info[0];
      $("overlay-copy").textContent = info[1];
      $("primary").replaceChildren(document.createTextNode(info[2] + " "));
      const k = document.createElement("kbd");
      k.textContent = "enter";
      $("primary").append(k);
      $("overlay-hint").textContent = info[3];
      $("overlay-icon").textContent = info[4];
      announce(
        state === "over"
          ? `Game over. ${game.score} points. Press Enter to play again.`
          : $("overlay-title").textContent,
      );
    } else
      announce(
        "Game started. Arrow keys move and rotate. Space drops. P pauses.",
      );
    if (state === "playing") canvas.focus({ preventScroll: true });
    else if (state !== "ready") $("primary").focus({ preventScroll: true });
  }
  if (game.lines > previousLines) {
    const n = game.lines - previousLines;
    $("score-note").textContent =
      n === 4
        ? "Four lines. Beautifully done."
        : `${n} ${n === 1 ? "line" : "lines"} cleared. Keep finding space.`;
    if (!reduced.matches) {
      $("clear-label").textContent =
        n === 4 ? "Beautiful." : n > 1 ? `${n} lines!` : "A little more space.";
      $("clear-label").classList.remove("show");
      void $("clear-label").offsetWidth;
      $("clear-label").classList.add("show");
    }
    announce(`${n} lines cleared. Score ${game.score}. Level ${game.level}.`);
  }
  previousLines = game.lines;
}
function start() {
  confirming = false;
  game.start();
  held.clear();
  last = 0;
  previousLines = 0;
  $("score-note").textContent = "Every line is a fresh start.";
  ui();
}
function primary() {
  if (confirming || game.state === "ready" || game.state === "over") start();
  else if (game.state === "paused") {
    game.pause();
    last = 0;
    ui();
  }
}
function pause() {
  if (confirming) {
    confirming = false;
    game.state = "paused";
  } else game.pause();
  held.clear();
  last = 0;
  ui();
}
function restart() {
  if (game.state === "ready" || game.state === "over") start();
  else {
    game.state = "paused";
    confirming = true;
    held.clear();
    ui();
  }
}
function openHelp() {
  if (game.state === "playing") {
    game.state = "paused";
    held.clear();
    ui();
  }
  $("help").showModal();
  $("help-toggle").setAttribute("aria-expanded", "true");
}
$("primary").addEventListener("click", primary);
$("pause").addEventListener("click", pause);
$("restart").addEventListener("click", restart);
$("help-toggle").addEventListener("click", openHelp);
$("help-close").addEventListener("click", () => $("help").close());
$("help").addEventListener("close", () => {
  $("help-toggle").setAttribute("aria-expanded", "false");
  held.clear();
  last = 0;
});
const actions = {
  ArrowLeft: () => game.move(-1),
  ArrowRight: () => game.move(1),
  ArrowDown: () => game.step(true),
};
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if ($("help").open) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
  if ((key === "Enter" || key === " ") && e.target.closest("button,a")) return;
  const recognized = [
    "ArrowLeft",
    "ArrowRight",
    "ArrowDown",
    "ArrowUp",
    " ",
    "x",
    "z",
    "p",
    "Escape",
    "Enter",
    "r",
    "?",
  ].includes(key);
  if (!recognized) return;
  e.preventDefault();
  if (actions[key]) {
    if (game.state === "playing" && !e.repeat && !held.has(key)) {
      actions[key]();
      held.set(key, { elapsed: 0, next: 150 });
    }
    return;
  }
  if (e.repeat) return;
  if (key === "Enter") primary();
  else if (key === "p" || key === "Escape") pause();
  else if (key === "r") restart();
  else if (key === "?") openHelp();
  else if (game.state === "playing") {
    if (key === " ") game.drop();
    else game.rotate(key === "z" ? -1 : 1);
  }
  ui();
});
window.addEventListener("keyup", (e) => held.delete(e.key));
function backgroundPause() {
  if (game.state === "playing") {
    game.state = "paused";
    held.clear();
    last = 0;
    ui();
  }
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) backgroundPause();
});
window.addEventListener("blur", backgroundPause);
function frame(timestamp) {
  const dt = last ? Math.min(timestamp - last, 100) : 0;
  last = timestamp;
  if (game.state === "playing" && !confirming) {
    for (const [key, v] of held) {
      v.elapsed += dt;
      while (v.elapsed >= v.next) {
        actions[key]();
        v.next += key === "ArrowDown" ? 40 : 55;
      }
    }
    game.update(dt);
  }
  ui();
  draw();
  requestAnimationFrame(frame);
}
ui();
draw();
requestAnimationFrame(frame);
