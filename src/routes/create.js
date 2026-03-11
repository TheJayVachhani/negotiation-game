const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

router.post('/', (req, res) => {
  const { player_name, max_rounds } = req.body;

  if (!player_name || typeof player_name !== 'string' || !player_name.trim()) {
    return res.status(400).json({ success: false, error: 'player_name is required' });
  }

  const name = player_name.trim().slice(0, 32);
  const rounds = Math.min(Math.max(parseInt(max_rounds) || 10, 3), 20);
  const gameId = uuidv4().slice(0, 8).toUpperCase();
  const now = Date.now();

  db.saveGame({ id: gameId, status: 'lobby', round: 0, max_rounds: rounds, created_at: now });
  db.savePlayer({
    game_id: gameId, player_name: name,
    gold: 0, wood: 0, food: 0, stone: 0,
    goal_gold: 0, goal_wood: 0, goal_food: 0, goal_stone: 0,
    passed: false, joined_at: now,
  });

  res.json({
    success: true,
    game_id: gameId,
    message: `Game created! Share game_id "${gameId}" with other players. When everyone has joined, call negotiation-start to begin.`,
    created_by: name,
    max_rounds: rounds,
    next_step: `Other players should call negotiation-join with game_id "${gameId}" and their player_name.`,
  });
});

module.exports = router;
