// Sizzle & Serve — recipes.js
// Every ingredient and dish in the game, with the steps a dish needs.
// A dish is a list of finished components; each component comes from one
// station: a bin (ready at once), the grill, the chopping board or the fryer.

export const INGREDIENTS = {
  bun:     { name: 'Bun',     color: '#e8b96a', dark: '#b97f2e', kind: 'bin',    key: '1', blurb: 'Soft brioche bun' },
  patty:   { name: 'Patty',   color: '#8a5a33', dark: '#5d3a1e', kind: 'grill',  key: '2', blurb: 'Raw beef patty — grill it!' },
  lettuce: { name: 'Lettuce', color: '#7dc242', dark: '#4d8a24', kind: 'board',  key: '3', blurb: 'Crisp lettuce — chop it' },
  tomato:  { name: 'Tomato',  color: '#e0492f', dark: '#a92c17', kind: 'board',  key: '4', blurb: 'Ripe tomato — chop it' },
  cheese:  { name: 'Cheese',  color: '#ffcf3d', dark: '#d9a400', kind: 'bin',    key: '5', blurb: 'Melty cheddar slice' },
  fries:   { name: 'Fries',   color: '#ffd76a', dark: '#c98f1b', kind: 'fryer',  key: '6', blurb: 'Potato sticks — fry them' },
};

// A finished component id is the ingredient id, except cooked/chopped ones.
export const FINISHED = {
  bun: 'bun',
  patty: 'pattyCooked',
  lettuce: 'lettuceChopped',
  tomato: 'tomatoChopped',
  cheese: 'cheese',
  fries: 'friesDone',
};

export const FINISHED_LABEL = {
  bun: 'Bun',
  pattyCooked: 'Grilled patty',
  lettuceChopped: 'Chopped lettuce',
  tomatoChopped: 'Chopped tomato',
  cheese: 'Cheese',
  friesDone: 'Golden fries',
};

// How long each station takes, in seconds.
export const STATION_TIME = { grill: 4, board: 2, fryer: 5 };

export const RECIPES = [
  {
    id: 'classic',
    name: 'Classic Burger',
    needs: ['bun', 'pattyCooked', 'lettuceChopped'],
    price: 100,
    color: '#e8b96a',
  },
  {
    id: 'cheesy',
    name: 'Cheesy Melt',
    needs: ['bun', 'pattyCooked', 'cheese'],
    price: 120,
    color: '#ffcf3d',
  },
  {
    id: 'garden',
    name: 'Garden Bowl',
    needs: ['lettuceChopped', 'tomatoChopped', 'cheese'],
    price: 90,
    color: '#7dc242',
  },
  {
    id: 'fries',
    name: 'Crispy Fries',
    needs: ['friesDone'],
    price: 60,
    color: '#ffd76a',
  },
  {
    id: 'double',
    name: 'Double Stack',
    needs: ['bun', 'pattyCooked', 'pattyCooked', 'cheese'],
    price: 180,
    color: '#8a5a33',
  },
  {
    id: 'deluxe',
    name: 'Deluxe Burger',
    needs: ['bun', 'pattyCooked', 'cheese', 'tomatoChopped', 'lettuceChopped'],
    price: 220,
    color: '#e0492f',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Pick a recipe for a new order: early shift favours easy dishes,
// later shift unlocks the big ones.
export function pickRecipe(elapsedSeconds, random) {
  const pool = elapsedSeconds < 45
    ? RECIPES.slice(0, 4)
    : elapsedSeconds < 110
      ? RECIPES.slice(0, 5)
      : RECIPES;
  return pool[Math.floor(random() * pool.length)];
}

// Does the plate's components match a recipe exactly (order-free)?
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const have = [...plate].sort();
  const want = [...recipe.needs].sort();
  return have.every((item, i) => item === want[i]);
}

// Which open order does this plate complete, if any? Returns its index or -1.
export function findMatchingOrder(plate, orders) {
  for (let i = 0; i < orders.length; i += 1) {
    if (plateMatchesRecipe(plate, orders[i].recipe)) return i;
  }
  return -1;
}
