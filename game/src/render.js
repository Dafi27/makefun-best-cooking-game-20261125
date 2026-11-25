// Sizzle & Serve — render.js
// Every pixel of the kitchen is drawn here on one canvas: the wall and
// floor, the order board, the ingredient bins, the grill, the chopping
// board, the fryer, the plating station, the serving window, the player's
// hands, and the title / game-over screens.

import { FINISHED_LABEL, INGREDIENTS, STATION_TIME } from './recipes.js';

export const VIEW = { width: 1280, height: 800 };

// Clickable zones, shared with input.js so clicks land where the art is.
export const ZONES = {
  bins: [
    { id: 'bun', x: 24, y: 240, w: 132, h: 108 },
    { id: 'patty', x: 168, y: 240, w: 132, h: 108 },
    { id: 'lettuce', x: 312, y: 240, w: 132, h: 108 },
    { id: 'tomato', x: 456, y: 240, w: 132, h: 108 },
    { id: 'cheese', x: 600, y: 240, w: 132, h: 108 },
    { id: 'fries', x: 744, y: 240, w: 132, h: 108 },
  ],
  grill: [
    { x: 48, y: 428, w: 130, h: 110 },
    { x: 196, y: 428, w: 130, h: 110 },
  ],
  board: [
    { x: 384, y: 428, w: 130, h: 110 },
    { x: 532, y: 428, w: 130, h: 110 },
  ],
  fryer: [
    { x: 716, y: 428, w: 110, h: 110 },
    { x: 838, y: 428, w: 110, h: 110 },
  ],
  plate: { x: 984, y: 388, w: 248, h: 180 },
  serve: { x: 984, y: 96, w: 272, h: 108 },
  trash: { x: 1140, y: 592, w: 116, h: 44 },
  start: { x: 490, y: 560, w: 300, h: 64 },
  restart: { x: 490, y: 600, w: 300, h: 64 },
  mute: { x: 1212, y: 12, w: 56, h: 40 },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// Draw one ingredient as a little piece of food art.
export function drawIngredient(ctx, id, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  const u = s / 64;
  if (id === 'bun') {
    ctx.fillStyle = '#e8b96a';
    ctx.beginPath(); ctx.ellipse(0, -6 * u, 30 * u, 20 * u, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#d99a3d';
    roundRect(ctx, -30 * u, -8 * u, 60 * u, 10 * u, 4 * u); ctx.fill();
    ctx.fillStyle = '#fff3d0';
    [[-14, -18], [0, -24], [14, -18], [-6, -12], [8, -13]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.ellipse(dx * u, dy * u, 3 * u, 2 * u, 0, 0, Math.PI * 2); ctx.fill();
    });
  } else if (id === 'patty' || id === 'pattyCooked') {
    ctx.fillStyle = id === 'patty' ? '#c98a6b' : '#6b4423';
    roundRect(ctx, -30 * u, -12 * u, 60 * u, 24 * u, 12 * u); ctx.fill();
    ctx.strokeStyle = id === 'patty' ? '#a96a4e' : '#3f2712';
    ctx.lineWidth = 3 * u;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath(); ctx.moveTo((i * 16 - 6) * u, -10 * u); ctx.lineTo((i * 16 + 6) * u, 10 * u); ctx.stroke();
    }
  } else if (id === 'lettuce' || id === 'lettuceChopped') {
    ctx.fillStyle = '#7dc242';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse((i - 1) * 18 * u, (i % 2 === 0 ? -4 : 4) * u, 20 * u, 12 * u, (i - 1) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#4d8a24'; ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.moveTo(-28 * u, 0); ctx.lineTo(28 * u, 0); ctx.stroke();
  } else if (id === 'tomato' || id === 'tomatoChopped') {
    ctx.fillStyle = '#e0492f';
    ctx.beginPath(); ctx.arc(-10 * u, 0, 15 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12 * u, 2 * u, 15 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8a70';
    ctx.beginPath(); ctx.arc(-14 * u, -5 * u, 5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4d8a24';
    ctx.beginPath(); ctx.ellipse(0, -14 * u, 8 * u, 4 * u, 0, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#ffcf3d';
    ctx.beginPath(); ctx.moveTo(-28 * u, 12 * u); ctx.lineTo(28 * u, 12 * u); ctx.lineTo(0, -18 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a800';
    [[-10, 2], [8, 4], [0, -6]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, 3 * u, 0, Math.PI * 2); ctx.fill();
    });
  } else if (id === 'fries' || id === 'friesDone') {
    ctx.fillStyle = id === 'fries' ? '#ffe9a8' : '#ffd76a';
    for (let i = -2; i <= 2; i += 1) {
      roundRect(ctx, (i * 11 - 4) * u, (-22 + Math.abs(i) * 2) * u, 8 * u, 34 * u, 2 * u); ctx.fill();
    }
    ctx.fillStyle = '#d9382b';
    ctx.beginPath(); ctx.moveTo(-30 * u, -2 * u); ctx.lineTo(30 * u, -2 * u); ctx.lineTo(24 * u, 24 * u); ctx.lineTo(-24 * u, 24 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 10 * u, 8 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9382b';
    text(ctx, 'F', 0, 10 * u, 13 * u, '#d9382b');
  }
  ctx.restore();
}

function drawStationSlot(ctx, zone, slot, station, now) {
  ctx.fillStyle = station === 'grill' ? '#3a3a40' : station === 'board' ? '#c89b6a' : '#2e4a6b';
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!slot) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    text(ctx, station === 'grill' ? 'GRILL' : station === 'board' ? 'CHOP' : 'FRY', zone.x + zone.w / 2, zone.y + zone.h / 2, 15, 'rgba(255,255,255,0.55)');
    return;
  }
  drawIngredient(ctx, slot.ingredient, zone.x + zone.w / 2, zone.y + zone.h / 2 - 8, 56);
  const total = STATION_TIME[station];
  const ratio = Math.min(1, slot.progress / total);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, zone.x + 10, zone.y + zone.h - 22, zone.w - 20, 12, 6); ctx.fill();
  ctx.fillStyle = slot.done ? '#7dc242' : '#ffb02e';
  roundRect(ctx, zone.x + 10, zone.y + zone.h - 22, (zone.w - 20) * ratio, 12, 6); ctx.fill();
  if (slot.done) {
    const pulse = 0.7 + 0.3 * Math.sin(now * 6);
    ctx.globalAlpha = pulse;
    text(ctx, 'READY!', zone.x + zone.w / 2, zone.y + zone.h + 16, 16, '#2f7d1e');
    ctx.globalAlpha = 1;
  } else if (station === 'grill') {
    // flames under a cooking patty
    ctx.fillStyle = '#ff7a1a';
    for (let i = 0; i < 3; i += 1) {
      const fx = zone.x + 30 + i * 35 + Math.sin(now * 9 + i * 2) * 4;
      ctx.beginPath();
      ctx.ellipse(fx, zone.y + zone.h - 6, 10, 7 + Math.sin(now * 12 + i) * 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawOrderTicket(ctx, order, x, y, w, h, now) {
  const patienceRatio = Math.max(0, order.patience / order.maxPatience);
  const urgent = patienceRatio < 0.35;
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = urgent ? '#d9382b' : '#c9a86a';
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();
  if (urgent) {
    text(ctx, order.recipe.name, x + 12, y + 18, 14, '#5a3a17', 'left');
    text(ctx, 'HURRY!', x + w - 10, y + 18, 12, '#d9382b', 'right');
  } else {
    text(ctx, order.recipe.name, x + w / 2, y + 18, 15, '#5a3a17');
  }
  // lay the needed components out in a row
  const n = order.recipe.needs.length;
  order.recipe.needs.forEach((need, i) => {
    const cx = x + (w / 2) + (i - (n - 1) / 2) * 40;
    drawIngredient(ctx, need, cx, y + 52, 30);
  });
  text(ctx, `${Math.ceil(order.patience)}s  ·  $${order.recipe.price}`, x + w / 2, y + 78, 12, '#7a5a30');
  ctx.fillStyle = '#e8dcc3';
  roundRect(ctx, x + 12, y + h - 18, w - 24, 10, 5); ctx.fill();
  ctx.fillStyle = patienceRatio > 0.5 ? '#7dc242' : patienceRatio > 0.25 ? '#ffb02e' : '#d9382b';
  roundRect(ctx, x + 12, y + h - 18, (w - 24) * patienceRatio, 10, 5); ctx.fill();
}

function drawPlateStack(ctx, plate, cx, cy) {
  // a white plate with the stacked components on it
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(cx, cy + 18, 92, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#eef1f4';
  ctx.beginPath(); ctx.ellipse(cx, cy + 14, 70, 15, 0, 0, Math.PI * 2); ctx.fill();
  plate.forEach((item, i) => {
    drawIngredient(ctx, item, cx, cy + 2 - i * 18, 48);
  });
  if (plate.length === 0) {
    text(ctx, 'empty plate', cx, cy - 6, 14, '#9aa0a6');
  }
}

export function drawKitchen(ctx, kitchen, now) {
  const { width: W, height: H } = VIEW;
  // wall and floor
  ctx.fillStyle = '#f2d7a7';
  ctx.fillRect(0, 0, W, 210);
  ctx.fillStyle = '#e9c48d';
  for (let x = 0; x < W; x += 64) ctx.fillRect(x, 196, 64, 4);
  ctx.fillStyle = '#b98d5f';
  for (let y = 0; y < 210; y += 52) {
    ctx.fillRect(0, y, W, 2);
  }
  ctx.fillStyle = '#8a6a45';
  ctx.fillRect(0, 210, W, 10);
  ctx.fillStyle = '#d9c1a3';
  ctx.fillRect(0, 220, W, H - 220);
  ctx.fillStyle = '#cbb294';
  for (let y = 220; y < H; y += 80) {
    for (let x = ((y / 80) % 2 === 0 ? 0 : 40); x < W; x += 80) ctx.fillRect(x, y, 78, 78);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, 220, W, H - 220);

  // ---- top HUD bar ----
  ctx.fillStyle = '#3b2a1a';
  ctx.fillRect(0, 0, W, 64);
  text(ctx, '🍳 SIZZLE & SERVE', 24, 34, 28, '#ffd76a', 'left');
  const mm = Math.floor(kitchen.timeLeft / 60);
  const ss = String(Math.floor(kitchen.timeLeft % 60)).padStart(2, '0');
  const timerColor = kitchen.timeLeft <= 30 ? '#ff5a4a' : '#ffffff';
  text(ctx, `⏱ ${mm}:${ss}`, W / 2, 34, 30, timerColor);
  text(ctx, `SCORE ${kitchen.score}`, W - 300, 24, 18, '#ffffff', 'right');
  text(ctx, `🪙 ${kitchen.coins}   🍽 ${kitchen.served} served   🔥 x${Math.max(1, kitchen.combo)}`, W - 300, 48, 15, '#ffd76a', 'right');
  const mute = ZONES.mute;
  ctx.fillStyle = '#5a4632';
  roundRect(ctx, mute.x, mute.y, mute.w, mute.h, 8); ctx.fill();
  text(ctx, kitchen.muted ? '🔇' : '🔊', mute.x + mute.w / 2, mute.y + mute.h / 2 + 1, 20, '#fff');

  // ---- order board ----
  ctx.fillStyle = '#5a3a1e';
  roundRect(ctx, 16, 76, 940, 140, 12); ctx.fill();
  text(ctx, '📋 ORDER BOARD', 36, 98, 16, '#ffd76a', 'left');
  if (kitchen.orders.length === 0) {
    text(ctx, 'No orders — take a breath, chef!', 496, 150, 18, '#e8dcc3');
  }
  kitchen.orders.forEach((order, i) => {
    drawOrderTicket(ctx, order, 32 + i * 232, 104, 216, 108, now);
  });

  // ---- serving window ----
  const serve = ZONES.serve;
  const match = kitchen.plate.length > 0
    ? kitchen.orders.some((o) => {
      const have = [...kitchen.plate].sort();
      const want = [...o.recipe.needs].sort();
      return have.length === want.length && have.every((v, i) => v === want[i]);
    })
    : false;
  ctx.fillStyle = match ? '#2f7d1e' : '#7a4a21';
  roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 12); ctx.fill();
  ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = match ? 4 : 2; ctx.stroke();
  text(ctx, '🛎 SERVE HERE', serve.x + serve.w / 2, serve.y + 26, 20, '#ffffff');
  text(ctx, match ? 'Plate matches an order!' : 'Match a ticket to serve', serve.x + serve.w / 2, serve.y + 56, 14, '#ffe9b0');
  text(ctx, match ? 'CLICK or press S' : 'S = serve', serve.x + serve.w / 2, serve.y + 82, 14, match ? '#b8f0a0' : '#d8c3a5');

  // ---- ingredient bins ----
  text(ctx, '🥬 INGREDIENTS — click a bin (or press 1–6)', 24, 230, 16, '#5a3a17', 'left');
  ZONES.bins.forEach((zone) => {
    const ing = INGREDIENTS[zone.id];
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12); ctx.fill();
    ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 2; ctx.stroke();
    drawIngredient(ctx, zone.id, zone.x + zone.w / 2, zone.y + 44, 58);
    text(ctx, ing.name, zone.x + zone.w / 2, zone.y + 84, 15, '#5a3a17');
    text(ctx, `[${ing.key}] ${ing.kind === 'bin' ? 'ready' : ing.kind === 'grill' ? '→ grill' : ing.kind === 'board' ? '→ chop' : '→ fry'}`, zone.x + zone.w / 2, zone.y + 100, 10, '#8a6a45');
  });

  // ---- stations ----
  text(ctx, '🔥 GRILL — patty takes 4s', 24, 408, 16, '#5a3a17', 'left');
  text(ctx, '🔪 CHOPPING BOARD — 2s', 360, 408, 16, '#5a3a17', 'left');
  text(ctx, '🍟 FRYER — fries take 5s', 692, 408, 16, '#5a3a17', 'left');
  text(ctx, '🍽 PLATING STATION', 984, 376, 16, '#5a3a17', 'left');
  ZONES.grill.forEach((z, i) => drawStationSlot(ctx, z, kitchen.grill[i], 'grill', now));
  ZONES.board.forEach((z, i) => drawStationSlot(ctx, z, kitchen.board[i], 'board', now));
  ZONES.fryer.forEach((z, i) => drawStationSlot(ctx, z, kitchen.fryer[i], 'fryer', now));

  // ---- plate ----
  const plate = ZONES.plate;
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, plate.x, plate.y, plate.w, plate.h, 12); ctx.fill();
  ctx.strokeStyle = match ? '#2f7d1e' : '#c9a86a'; ctx.lineWidth = match ? 4 : 2; ctx.stroke();
  drawPlateStack(ctx, kitchen.plate, plate.x + plate.w / 2, plate.y + 92);
  if (match) text(ctx, '✓ READY TO SERVE!', plate.x + plate.w / 2, plate.y + 158, 16, '#2f7d1e');
  else if (kitchen.plate.length > 0) text(ctx, `${kitchen.plate.length} item${kitchen.plate.length > 1 ? 's' : ''} on the plate`, plate.x + plate.w / 2, plate.y + 158, 13, '#8a6a45');
  const trash = ZONES.trash;
  ctx.fillStyle = '#b3402e';
  roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 8); ctx.fill();
  text(ctx, '🗑 Clear plate', trash.x + trash.w / 2, trash.y + trash.h / 2, 13, '#fff');

  // ---- bottom bar: hands + message ----
  ctx.fillStyle = '#3b2a1a';
  roundRect(ctx, 16, 648, 1248, 140, 12); ctx.fill();
  text(ctx, '🙌 YOUR HANDS', 40, 672, 16, '#ffd76a', 'left');
  for (let i = 0; i < 2; i += 1) {
    const hx = 40 + i * 120;
    ctx.fillStyle = '#5a4632';
    roundRect(ctx, hx, 688, 108, 76, 10); ctx.fill();
    const item = kitchen.hands[i];
    if (item) {
      drawIngredient(ctx, item, hx + 54, 716, 48);
      text(ctx, FINISHED_LABEL[item] || INGREDIENTS[item]?.name || item, hx + 54, 752, 11, '#ffe9b0');
    } else {
      text(ctx, 'empty', hx + 54, 726, 13, '#a98f6d');
    }
  }
  const flashActive = kitchen.flash && now < kitchen.flashUntil;
  text(ctx, flashActive ? kitchen.flash : 'Tip: grill the patty, chop the veg, fry the fries — then plate and serve before the ticket runs out!', 300, 700, 16, flashActive ? '#ffd76a' : '#d8c3a5', 'left');
  text(ctx, 'Keys: 1–6 bins · G grill · C chop · F fry · P plate · S serve · R restart · M mute', 300, 736, 13, '#a98f6d', 'left');
  text(ctx, `Orders served: ${kitchen.served}   Walked out: ${kitchen.lost}   Best combo: x${kitchen.bestCombo}`, 300, 762, 13, '#a98f6d', 'left');

  // floating score popups
  for (const popup of kitchen.popups) {
    const age = now - popup.bornAt;
    ctx.globalAlpha = Math.max(0, 1 - age / 1.4);
    text(ctx, popup.text, popup.x, popup.y - age * 40, 22, popup.color);
    ctx.globalAlpha = 1;
  }

  if (kitchen.phase === 'title') drawTitleScreen(ctx, now);
  if (kitchen.phase === 'over') drawGameOverScreen(ctx, kitchen, now);
}

function drawTitleScreen(ctx, now) {
  ctx.fillStyle = 'rgba(30, 18, 8, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 240, 90, 800, 560, 20); ctx.fill();
  ctx.strokeStyle = '#e8b96a'; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, '🍳', 640, 170, 64, '#000');
  text(ctx, 'SIZZLE & SERVE', 640, 232, 52, '#b3402e');
  text(ctx, 'a tiny cooking game — run the lunch rush!', 640, 276, 20, '#7a5a30');
  const lines = [
    '1 · Orders appear on the board — each ticket lists what the dish needs.',
    '2 · Grab ingredients from the bins. Patties go on the GRILL (4s),',
    '     lettuce & tomato on the CHOPPING BOARD (2s), fries in the FRYER (5s).',
    '3 · Stack the finished food on the PLATE, then SERVE at the window.',
    '4 · Serve fast for a patience tip. Chain serves for a combo bonus.',
    '5 · One shift lasts 3 minutes. Don\'t let a ticket run out!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 330 + i * 30, 17, '#4a3220', 'center', 'normal'));
  const pulse = 0.75 + 0.25 * Math.sin(now * 4);
  ctx.globalAlpha = pulse;
  const start = ZONES.start;
  ctx.fillStyle = '#2f7d1e';
  roundRect(ctx, start.x, start.y, start.w, start.h, 14); ctx.fill();
  text(ctx, '▶  START SHIFT', start.x + start.w / 2, start.y + start.h / 2, 24, '#fff');
  ctx.globalAlpha = 1;
  text(ctx, 'Click START or press Enter · Mouse + keyboard · No downloads, no network', 640, 648, 13, '#8a6a45');
}

function drawGameOverScreen(ctx, kitchen, now) {
  ctx.fillStyle = 'rgba(30, 18, 8, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 340, 130, 600, 500, 20); ctx.fill();
  ctx.strokeStyle = '#e8b96a'; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, '⏰ SHIFT OVER!', 640, 190, 44, '#b3402e');
  text(ctx, kitchen.served >= 8 ? '🌟 Head Chef material!' : kitchen.served >= 4 ? '👍 A solid lunch rush!' : '🍳 The kitchen is still standing — practice!', 640, 240, 18, '#7a5a30');
  text(ctx, `SCORE  ${kitchen.score}`, 640, 310, 36, '#3b2a1a');
  const rows = [
    `Dishes served: ${kitchen.served}`,
    `Coins earned: ${kitchen.coins}`,
    `Customers walked out: ${kitchen.lost}`,
    `Best combo: x${kitchen.bestCombo}`,
  ];
  rows.forEach((row, i) => text(ctx, row, 640, 370 + i * 32, 19, '#4a3220', 'center', 'normal'));
  const restart = ZONES.restart;
  ctx.fillStyle = '#2f7d1e';
  roundRect(ctx, restart.x, restart.y, restart.w, restart.h, 14); ctx.fill();
  text(ctx, '↻  PLAY AGAIN  (R)', restart.x + restart.w / 2, restart.y + restart.h / 2, 22, '#fff');
}
