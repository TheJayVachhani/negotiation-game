const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/', (req, res) => {
  const { game_id, player_name } = req.body;

  if (!game_id || !player_name) {
    return res.status(400).json({ success: false, error: 'game_id and player_name are required' });
  }

  const name = player_name.trim().slice(0, 32);
  const game = db.getGame(game_id);

  if (!game) {
    return res.status(404).json({ success: false, error: `Game "${game_id}" not found. Check the game_id.` });
  }
  if (game.status !== 'lobby') {
    return res.status(400).json({ success: false, error: `Game "${game_id}" has already ${game.status === 'active' ? 'started' : 'ended'}.` });
  }
  if (db.getPlayer(game_id, name)) {
    return res.status(400).json({ success: false, error: `Player "${name}" is already in game "${game_id}".` });
  }

  const players = db.getPlayersInGame(game_id);
  if (players.length >= 4) {
    return res.status(400).json({ success: false, error: 'Game is full (max 4 players).' });
  }

  db.savePlayer({
    game_id, player_name: name,
    gold: 0, wood: 0, food: 0, stone: 0,
    goal_gold: 0, goal_wood: 0, goal_food: 0, goal_stone: 0,
    passed: false, joined_at: Date.now(),
  });

  const updatedPlayers = db.getPlayersInGame(game_id);

  res.json({
    success: true,
    game_id,
    player_name: name,
    players_in_lobby: updatedPlayers.map(p => p.player_name),
    message: `Joined game "${game_id}" successfully. ${updatedPlayers.length} player(s) in lobby. When ready, call negotiation-start.`,
  });
});

module.exports = router;
