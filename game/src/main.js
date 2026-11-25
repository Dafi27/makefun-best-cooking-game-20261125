// Sizzle & Serve — main.js
// Boots the game: canvas, loop, input wiring, and the demo scenes the
// screenshots use (?demo=kitchen | assembly | ready | rush). The demo
// scenes are the game itself with a preset state — no special rendering.

import { KitchenAudio } from './audio.js';
import { handleCanvasClick, handleKey } from './input.js';
import { anyStationDone, makeOrder, newKitchen, startShift, tickKitchen } from './kitchen.js';
import { recipeById } from './recipes.js';
import { VIEW, drawKitchen } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = new KitchenAudio();
let kitchen = newKitchen();
let lastTime = performance.now();
let lastDingAt = 0;

// Demo presets for screenshots: build a lively mid-shift state.
function applyDemo(name, now) {
  const fresh = startShift(kitchen, now);
  Object.assign(kitchen, fresh);
  if (name === 'kitchen') {
    kitchen.orders = [makeOrder(recipeById('classic'), now), makeOrder(recipeById('cheesy'), now)];
    kitchen.orders[0].patience = 42;
    kitchen.orders[1].patience = 28;
    kitchen.hands = ['bun'];
    kitchen.timeLeft = 152;
    kitchen.elapsed = 28;
    kitchen.score = 120;
    kitchen.coins = 120;
    kitchen.served = 1;
  } else if (name === 'assembly') {
    kitchen.orders = [
      makeOrder(recipeById('deluxe'), now),
      makeOrder(recipeById('classic'), now),
      makeOrder(recipeById('garden'), now),
    ];
    kitchen.orders[0].patience = 34;
    kitchen.orders[1].patience = 18;
    kitchen.orders[2].patience = 44;
    kitchen.plate = ['bun', 'pattyCooked'];
    kitchen.hands = ['cheese'];
    kitchen.grill = [{ ingredient: 'patty', progress: 2.6, done: false }, null];
    kitchen.board = [{ ingredient: 'tomato', progress: 1.4, done: false }, null];
    kitchen.fryer = [{ ingredient: 'fries', progress: 3.8, done: false }, null];
    kitchen.timeLeft = 134;
    kitchen.elapsed = 46;
    kitchen.score = 310;
    kitchen.coins = 310;
    kitchen.served = 3;
    kitchen.combo = 2;
  } else if (name === 'ready') {
    kitchen.orders = [makeOrder(recipeById('classic'), now), makeOrder(recipeById('fries'), now)];
    kitchen.orders[0].patience = 22;
    kitchen.orders[1].patience = 40;
    kitchen.plate = ['bun', 'pattyCooked', 'lettuceChopped'];
    kitchen.hands = [];
    kitchen.grill = [null, { ingredient: 'patty', progress: 4, done: true }];
    kitchen.timeLeft = 96;
    kitchen.elapsed = 84;
    kitchen.score = 540;
    kitchen.coins = 540;
    kitchen.served = 5;
    kitchen.combo = 3;
  } else if (name === 'rush') {
    kitchen.orders = [
      makeOrder(recipeById('double'), now),
      makeOrder(recipeById('deluxe'), now),
      makeOrder(recipeById('cheesy'), now),
      makeOrder(recipeById('garden'), now),
    ];
    kitchen.orders[0].patience = 9;
    kitchen.orders[1].patience = 16;
    kitchen.orders[2].patience = 31;
    kitchen.orders[3].patience = 45;
    kitchen.plate = ['bun'];
    kitchen.hands = ['pattyCooked'];
    kitchen.grill = [{ ingredient: 'patty', progress: 4, done: true }, { ingredient: 'patty', progress: 1.2, done: false }];
    kitchen.board = [{ ingredient: 'lettuce', progress: 2, done: true }, null];
    kitchen.fryer = [{ ingredient: 'fries', progress: 5, done: true }, null];
    kitchen.timeLeft = 41;
    kitchen.elapsed = 139;
    kitchen.score = 890;
    kitchen.coins = 890;
    kitchen.served = 8;
    kitchen.combo = 4;
    kitchen.bestCombo = 4;
  }
}

const params = new URLSearchParams(window.location.search);
const demo = params.get('demo');
if (demo) applyDemo(demo, performance.now() / 1000);

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * VIEW.width;
  const y = ((event.clientY - rect.top) / rect.height) * VIEW.height;
  audio.ensure();
  handleCanvasClick(kitchen, audio, x, y, performance.now() / 1000);
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  audio.ensure();
  handleKey(kitchen, audio, event.key, performance.now() / 1000);
});

function frame(nowMs) {
  const now = nowMs / 1000;
  const dt = Math.min(0.1, (nowMs - lastTime) / 1000);
  lastTime = nowMs;
  tickKitchen(kitchen, dt, now);
  if (kitchen.phase === 'playing') {
    if (anyStationDone(kitchen) && now - lastDingAt > 1.2) {
      audio.ding();
      lastDingAt = now;
    }
    const cooking = [...kitchen.grill, ...kitchen.fryer].some((s) => s && !s.done);
    if (cooking) audio.startSizzle();
    else audio.stopSizzle();
  } else {
    audio.stopSizzle();
  }
  drawKitchen(ctx, kitchen, now);
  requestAnimationFrame(frame);
}

// Hooks for automated play-testing (not part of the game UI).
window.__game = {
  get kitchen() { return kitchen; },
  click(x, y) { return handleCanvasClick(kitchen, audio, x, y, performance.now() / 1000); },
  key(k) { return handleKey(kitchen, audio, k, performance.now() / 1000); },
  start() {
    const fresh = startShift(kitchen, performance.now() / 1000);
    Object.assign(kitchen, fresh);
    return 'start';
  },
};

requestAnimationFrame(frame);
