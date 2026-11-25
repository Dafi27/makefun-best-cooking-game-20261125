// Sizzle & Serve — kitchen.js
// The whole game state: orders, stations, the plate, the player's hands,
// the shift timer and the score. No drawing here — render.js draws it.

import { FINISHED, STATION_TIME, findMatchingOrder, pickRecipe, recipeById } from './recipes.js';

export const SHIFT_LENGTH = 180; // seconds per shift
export const MAX_ORDERS = 4;
export const HAND_SIZE = 2;

export function makeOrder(recipe, now) {
  return {
    id: Math.random().toString(36).slice(2, 8),
    recipe,
    patience: 50, // seconds before the customer walks out
    maxPatience: 50,
    bornAt: now,
  };
}

export function newKitchen() {
  return {
    phase: 'title', // title | playing | over
    timeLeft: SHIFT_LENGTH,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    orders: [],
    nextOrderIn: 1.5,
    hands: [], // finished component ids the player carries (max HAND_SIZE)
    plate: [], // finished component ids on the plate
    grill: [null, null], // { ingredient, progress, done } or null
    board: [null, null],
    fryer: [null, null],
    flash: '', // short message shown over the kitchen
    flashUntil: 0,
    popups: [], // { x, y, text, color, bornAt }
    servedLog: [],
    muted: false,
    startedAt: 0,
  };
}

export function startShift(kitchen, now) {
  const fresh = newKitchen();
  fresh.phase = 'playing';
  fresh.startedAt = now;
  fresh.orders = [makeOrder(recipeById('classic'), now), makeOrder(recipeById('fries'), now)];
  fresh.nextOrderIn = 12;
  return fresh;
}

function stationArray(kitchen, station) {
  if (station === 'grill') return kitchen.grill;
  if (station === 'board') return kitchen.board;
  return kitchen.fryer;
}

export function stationBusyCount(kitchen) {
  let n = 0;
  for (const slot of [...kitchen.grill, ...kitchen.board, ...kitchen.fryer]) if (slot) n += 1;
  return n;
}

// Advance timers: cooking progress, order patience, spawning, shift clock.
export function tickKitchen(kitchen, dt, now) {
  if (kitchen.phase !== 'playing') return;
  kitchen.elapsed += dt;
  kitchen.timeLeft = Math.max(0, SHIFT_LENGTH - kitchen.elapsed);
  if (kitchen.timeLeft <= 0) {
    kitchen.phase = 'over';
    return;
  }

  for (const station of ['grill', 'board', 'fryer']) {
    for (const slot of stationArray(kitchen, station)) {
      if (slot && !slot.done) {
        slot.progress += dt;
        if (slot.progress >= STATION_TIME[station]) slot.done = true;
      }
    }
  }

  for (const order of kitchen.orders) {
    order.patience -= dt;
  }
  const walked = kitchen.orders.filter((o) => o.patience <= 0);
  if (walked.length > 0) {
    kitchen.orders = kitchen.orders.filter((o) => o.patience > 0);
    kitchen.lost += walked.length;
    kitchen.combo = 0;
    setFlash(kitchen, `A customer walked out! -${walked.length} order${walked.length > 1 ? 's' : ''}`, now);
  }

  kitchen.nextOrderIn -= dt;
  if (kitchen.nextOrderIn <= 0 && kitchen.orders.length < MAX_ORDERS) {
    kitchen.orders.push(makeOrder(pickRecipe(kitchen.elapsed, Math.random), now));
    kitchen.nextOrderIn = 11 + Math.random() * 5;
  } else if (kitchen.orders.length >= MAX_ORDERS) {
    kitchen.nextOrderIn = 4;
  }

  kitchen.popups = kitchen.popups.filter((p) => now - p.bornAt < 1.4);
}

export function setFlash(kitchen, text, now) {
  kitchen.flash = text;
  kitchen.flashUntil = now + 2.2;
}

function addPopup(kitchen, x, y, text, color, now) {
  kitchen.popups.push({ x, y, text, color, bornAt: now });
}

// Pick an ingredient from a bin into the player's hands.
export function takeFromBin(kitchen, ingredientId, now) {
  if (kitchen.phase !== 'playing') return 'not-playing';
  if (kitchen.hands.length >= HAND_SIZE) { setFlash(kitchen, 'Hands full! Serve or plate something first.', now); return 'hands-full'; }
  kitchen.hands.push(ingredientId);
  return 'ok';
}

// Put a carried raw ingredient onto a station slot, or take a finished one off.
export function useStation(kitchen, station, slotIndex, now) {
  if (kitchen.phase !== 'playing') return 'not-playing';
  const slots = stationArray(kitchen, station);
  const slot = slots[slotIndex];
  if (slot) {
    if (!slot.done) { setFlash(kitchen, 'Still cooking — wait for the ding!', now); return 'not-ready'; }
    if (kitchen.hands.length >= HAND_SIZE) { setFlash(kitchen, 'Hands full!', now); return 'hands-full'; }
    kitchen.hands.push(FINISHED[slot.ingredient]);
    slots[slotIndex] = null;
    return 'collected';
  }
  // Empty slot: find a matching raw ingredient in hand.
  const wanted = station === 'grill' ? 'patty' : station === 'board' ? ['lettuce', 'tomato'] : 'fries';
  const handIndex = kitchen.hands.findIndex((h) => (Array.isArray(wanted) ? wanted.includes(h) : h === wanted));
  if (handIndex === -1) {
    setFlash(kitchen, station === 'grill' ? 'Bring a raw patty to the grill.'
      : station === 'board' ? 'Bring lettuce or tomato to chop.'
        : 'Bring potato sticks to the fryer.', now);
    return 'wrong-item';
  }
  const ingredient = kitchen.hands.splice(handIndex, 1)[0];
  slots[slotIndex] = { ingredient, progress: 0, done: false };
  return 'started';
}

// Place a carried finished component onto the plate, or pick the last one back up.
export function usePlate(kitchen, now) {
  if (kitchen.phase !== 'playing') return 'not-playing';
  if (kitchen.hands.length > 0) {
    const item = kitchen.hands[kitchen.hands.length - 1];
    if (item === 'patty' || item === 'lettuce' || item === 'tomato' || item === 'fries') {
      setFlash(kitchen, 'That needs cooking first — grill, chop or fry it!', now);
      return 'raw';
    }
    kitchen.hands.pop();
    kitchen.plate.push(item);
    return 'placed';
  }
  if (kitchen.plate.length > 0) {
    kitchen.hands.push(kitchen.plate.pop());
    return 'picked-back';
  }
  setFlash(kitchen, 'The plate is empty — bring an ingredient!', now);
  return 'empty';
}

// Serve the plate at the window. Pays the matching order, or fails.
export function servePlate(kitchen, now) {
  if (kitchen.phase !== 'playing') return 'not-playing';
  if (kitchen.plate.length === 0) { setFlash(kitchen, 'Nothing on the plate to serve!', now); return 'empty'; }
  const orderIndex = findMatchingOrder(kitchen.plate, kitchen.orders);
  if (orderIndex === -1) {
    kitchen.combo = 0;
    setFlash(kitchen, 'No order matches this plate — check the tickets!', now);
    return 'no-match';
  }
  const order = kitchen.orders[orderIndex];
  const patienceBonus = Math.round((order.patience / order.maxPatience) * 60);
  const comboBonus = kitchen.combo * 10;
  const earned = order.recipe.price + patienceBonus + comboBonus;
  kitchen.score += earned;
  kitchen.coins += earned;
  kitchen.served += 1;
  kitchen.combo += 1;
  kitchen.bestCombo = Math.max(kitchen.bestCombo, kitchen.combo);
  kitchen.orders.splice(orderIndex, 1);
  kitchen.plate = [];
  kitchen.servedLog.push({ dish: order.recipe.name, earned, at: kitchen.elapsed });
  addPopup(kitchen, 1010, 430, `+${earned} coins`, '#ffd76a', now);
  setFlash(kitchen, `${order.recipe.name} served! +${earned} coins${kitchen.combo > 1 ? ` · Combo x${kitchen.combo}!` : ''}`, now);
  return 'served';
}

// Clear the plate into the bin (a mercy button for a wrong build).
export function trashPlate(kitchen, now) {
  if (kitchen.phase !== 'playing') return 'not-playing';
  if (kitchen.plate.length === 0) return 'empty';
  kitchen.plate = [];
  kitchen.combo = 0;
  setFlash(kitchen, 'Plate cleared. Start the dish again!', now);
  return 'trashed';
}

export function anyStationDone(kitchen) {
  return [...kitchen.grill, ...kitchen.board, ...kitchen.fryer].some((s) => s && s.done);
}

export function shiftSummary(kitchen) {
  return {
    score: kitchen.score,
    coins: kitchen.coins,
    served: kitchen.served,
    lost: kitchen.lost,
    bestCombo: kitchen.bestCombo,
  };
}
