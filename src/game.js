const RESOURCES = ['gold', 'wood', 'food', 'stone'];
const STARTING_TOTAL = 20; // total resources per player to distribute

function randomAllocation() {
  const alloc = { gold: 0, wood: 0, food: 0, stone: 0 };
  let remaining = STARTING_TOTAL;
  const keys = [...RESOURCES];

  // Distribute remaining between resources, ensuring at least 1 each
  for (let i = 0; i < keys.length - 1; i++) {
    const maxForThis = remaining - (keys.length - 1 - i);
    const amount = 1 + Math.floor(Math.random() * (maxForThis - 1));
    alloc[keys[i]] = amount;
    remaining -= amount;
  }
  alloc[keys[keys.length - 1]] = remaining;

  return alloc;
}

function calculateScore(player) {
  let score = 0;
  for (const r of RESOURCES) {
    const current = player[r];
    const goal = player[`goal_${r}`];
    // Points for each resource matched toward goal; penalty for excess over goal
    if (current >= goal) {
      score += goal * 2; // full points for meeting goal
    } else {
      score += current * 2 - (goal - current); // partial credit, penalty for shortfall
    }
  }
  return Math.max(0, score);
}

function getPublicPlayerState(player) {
  return {
    player_name: player.player_name,
    resources: {
      gold: player.gold,
      wood: player.wood,
      food: player.food,
      stone: player.stone,
    },
    passed: player.passed === 1,
  };
}

function getPrivatePlayerState(player) {
  return {
    ...getPublicPlayerState(player),
    goal: {
      gold: player.goal_gold,
      wood: player.goal_wood,
      food: player.goal_food,
      stone: player.goal_stone,
    },
    score: calculateScore(player),
    hint: goalHint(player),
  };
}

function goalHint(player) {
  const needs = [];
  const has_excess = [];
  for (const r of RESOURCES) {
    const diff = player[`goal_${r}`] - player[r];
    if (diff > 0) needs.push(`${diff} more ${r}`);
    else if (diff < 0) has_excess.push(`${Math.abs(diff)} extra ${r}`);
  }
  const parts = [];
  if (needs.length) parts.push(`You need: ${needs.join(', ')}`);
  if (has_excess.length) parts.push(`You have excess: ${has_excess.join(', ')}`);
  return parts.length ? parts.join('. ') : 'Your resources perfectly match your goal!';
}

function formatOffer(offer) {
  const giving = RESOURCES.filter(r => offer[`give_${r}`] > 0)
    .map(r => `${offer[`give_${r}`]} ${r}`).join(', ') || 'nothing';
  const wanting = RESOURCES.filter(r => offer[`want_${r}`] > 0)
    .map(r => `${offer[`want_${r}`]} ${r}`).join(', ') || 'nothing';
  return {
    offer_id: offer.id,
    from: offer.from_player,
    to: offer.to_player,
    giving,
    wanting,
    message: offer.message || null,
    status: offer.status,
  };
}

module.exports = {
  RESOURCES,
  randomAllocation,
  calculateScore,
  getPublicPlayerState,
  getPrivatePlayerState,
  formatOffer,
};
