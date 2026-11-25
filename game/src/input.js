// Sizzle & Serve — input.js
// Mouse clicks and keyboard shortcuts, translated into kitchen actions.
// Every clickable thing on the canvas is a zone from render.js, so the
// art and the hit-boxes can never drift apart.

import { ZONES } from './render.js';
import { servePlate, startShift, takeFromBin, trashPlate, usePlate, useStation } from './kitchen.js';
import { INGREDIENTS } from './recipes.js';

function inside(x, y, zone) {
  return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
}

function stationIndex(zones, x, y) {
  for (let i = 0; i < zones.length; i += 1) if (inside(x, y, zones[i])) return i;
  return -1;
}

export function handleCanvasClick(kitchen, audio, x, y, now) {
  if (inside(x, y, ZONES.mute)) {
    kitchen.muted = audio.toggleMute();
    return 'mute';
  }
  if (kitchen.phase === 'title') {
    if (inside(x, y, ZONES.start)) {
      const fresh = startShift(kitchen, now);
      Object.assign(kitchen, fresh);
      audio.ensure();
      audio.ding();
      return 'start';
    }
    return 'title';
  }
  if (kitchen.phase === 'over') {
    if (inside(x, y, ZONES.restart)) {
      const fresh = startShift(kitchen, now);
      Object.assign(kitchen, fresh);
      audio.ding();
      return 'restart';
    }
    return 'over';
  }

  // Playing: bins first, then stations, plate, serve window, trash.
  for (const zone of ZONES.bins) {
    if (inside(x, y, zone)) {
      const result = takeFromBin(kitchen, zone.id, now);
      if (result === 'ok') audio.pickUp(); else audio.error();
      return `bin:${zone.id}:${result}`;
    }
  }
  let slot = stationIndex(ZONES.grill, x, y);
  if (slot !== -1) {
    const result = useStation(kitchen, 'grill', slot, now);
    if (result === 'started') audio.startSizzle();
    if (result === 'collected') audio.pickUp();
    if (result === 'wrong-item' || result === 'not-ready' || result === 'hands-full') audio.error();
    return `grill:${result}`;
  }
  slot = stationIndex(ZONES.board, x, y);
  if (slot !== -1) {
    const result = useStation(kitchen, 'board', slot, now);
    if (result === 'started') audio.chop();
    if (result === 'collected') audio.pickUp();
    if (result === 'wrong-item' || result === 'not-ready' || result === 'hands-full') audio.error();
    return `board:${result}`;
  }
  slot = stationIndex(ZONES.fryer, x, y);
  if (slot !== -1) {
    const result = useStation(kitchen, 'fryer', slot, now);
    if (result === 'started') audio.startSizzle();
    if (result === 'collected') audio.pickUp();
    if (result === 'wrong-item' || result === 'not-ready' || result === 'hands-full') audio.error();
    return `fryer:${result}`;
  }
  if (inside(x, y, ZONES.plate)) {
    const result = usePlate(kitchen, now);
    if (result === 'placed' || result === 'picked-back') audio.place();
    else audio.error();
    return `plate:${result}`;
  }
  if (inside(x, y, ZONES.serve)) {
    const result = servePlate(kitchen, now);
    if (result === 'served') audio.serveFanfare();
    else audio.error();
    return `serve:${result}`;
  }
  if (inside(x, y, ZONES.trash)) {
    const result = trashPlate(kitchen, now);
    if (result === 'trashed') audio.error();
    return `trash:${result}`;
  }
  return 'miss';
}

export function handleKey(kitchen, audio, key, now) {
  const lower = key.toLowerCase();
  if (lower === 'm') {
    kitchen.muted = audio.toggleMute();
    return 'mute';
  }
  if (kitchen.phase === 'title' && (key === 'Enter' || key === ' ')) {
    const fresh = startShift(kitchen, now);
    Object.assign(kitchen, fresh);
    audio.ensure();
    audio.ding();
    return 'start';
  }
  if (kitchen.phase === 'over' && lower === 'r') {
    const fresh = startShift(kitchen, now);
    Object.assign(kitchen, fresh);
    audio.ding();
    return 'restart';
  }
  if (kitchen.phase !== 'playing') return 'idle';
  if (lower === 'r') {
    const fresh = startShift(kitchen, now);
    Object.assign(kitchen, fresh);
    return 'restart';
  }
  // Number keys pick bins 1-6.
  const byKey = Object.values(INGREDIENTS).find((ing) => ing.key === key);
  if (byKey) {
    const id = Object.keys(INGREDIENTS).find((k) => INGREDIENTS[k] === byKey);
    const result = takeFromBin(kitchen, id, now);
    if (result === 'ok') audio.pickUp(); else audio.error();
    return `bin:${id}:${result}`;
  }
  if (lower === 'g') return `grill:${useStation(kitchen, 'grill', 0, now)}`;
  if (lower === 'c') return `board:${useStation(kitchen, 'board', 0, now)}`;
  if (lower === 'f') return `fryer:${useStation(kitchen, 'fryer', 0, now)}`;
  if (lower === 'p') {
    const result = usePlate(kitchen, now);
    if (result === 'placed') audio.place(); else audio.error();
    return `plate:${result}`;
  }
  if (lower === 's') {
    const result = servePlate(kitchen, now);
    if (result === 'served') audio.serveFanfare(); else audio.error();
    return `serve:${result}`;
  }
  return 'idle';
}
