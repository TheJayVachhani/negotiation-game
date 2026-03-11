const express = require('express');
const db = require('../db');
const { randomAllocation } = require('../game');

const router = express.Router();

router.post('/', (req, res) => {
  const { game_id, player_name } = req.body;

  if (!game_id || !player_name) {
    return res.status(400).json({ success: false, error: 'game_id and player_name are required' });
  }

  const name = player_name.trim();
  const game = db.getGame(game_id);
  if (!game) return res.status(404).json({ success: false, error: `Game "${game_id}" not found.` });
  if (game.status !== 'lobby') {
    return res.status(400).json({ success: false, error: `Game "${game_id}" has already ${game.status === 'active' ? 'started' : 'ended'}.` });
  }

  const player = db.getPlayer(game_id, name);
  if (!player) return res.status(403).json({ success: false, error: `You are not in game "${game_id}". Join first.` });

  const players = db.getPlayersInGame(game_id);
  if (players.length < 2) {
    return res.status(400).json({ success: false, error: 'Need at least 2 players to start.' });
  }

  // Assign random resources and secret goals to each player
  const updatedPlayers = players.map(p => {
    const resources = randomAllocation();
    const goal = randomAllocation();
    return {
      ...p,
      gold: resources.gold, wood: resources.wood, food: resources.food, stone: resources.stone,
      goal_gold: goal.gold, goal_wood: goal.wood, goal_food: goal.food, goal_stone: goal.stone,
    };
  });
  db.saveAllPlayers(updatedPlayers);

  db.saveGame({ ...game, status: 'active', round: 1, started_at: Date.now() });

  const me = db.getPlayer(game_id, name);

  res.json({
    success: true,
    message: `Game "${game_id}" has started! ${players.length} players competing. Use negotiation-offer to start trading.`,
    game_id,
    players: players.map(p => p.player_name),
    your_resources: { gold: me.gold, wood: me.wood, food: me.food, stone: me.stone },
    your_goal: { gold: me.goal_gold, wood: me.goal_wood, food: me.goal_food, stone: me.goal_stone },
    tip: 'Your goal is SECRET. Other players cannot see it. Trade to get closer to your goal!',
    max_rounds: game.max_rounds,
  });
});

module.exports = router;
