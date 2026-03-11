const express = require('express');
const db = require('../db');
const { getPublicPlayerState, getPrivatePlayerState, formatOffer, calculateScore } = require('../game');

const router = express.Router();

router.post('/', (req, res) => {
  const { game_id, player_name } = req.body;

  if (!game_id || !player_name) {
    return res.status(400).json({ success: false, error: 'game_id and player_name are required' });
  }

  const name = player_name.trim();
  const game = db.getGame(game_id);
  if (!game) return res.status(404).json({ success: false, error: `Game "${game_id}" not found.` });

  const me = db.getPlayer(game_id, name);
  if (!me) return res.status(403).json({ success: false, error: `You are not in game "${game_id}". Check your player_name.` });

  const allPlayers = db.getPlayersInGame(game_id);
  const allOffers = db.getOffersInGame(game_id);

  const pendingToMe = allOffers.filter(o => o.to_player === name && o.status === 'pending');
  const myPending = allOffers.filter(o => o.from_player === name && o.status === 'pending');
  const recentResolved = allOffers
    .filter(o => o.status !== 'pending')
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 10);

  const response = {
    success: true,
    game_id,
    status: game.status,
    round: game.round,
    max_rounds: game.max_rounds,
    your_state: getPrivatePlayerState(me),
    other_players: allPlayers.filter(p => p.player_name !== name).map(getPublicPlayerState),
    offers_awaiting_your_response: pendingToMe.map(formatOffer),
    your_pending_offers: myPending.map(formatOffer),
    recent_resolved_offers: recentResolved.map(formatOffer),
  };

  if (game.status === 'finished') {
    const standings = allPlayers
      .map(p => ({ player: p.player_name, score: calculateScore(p) }))
      .sort((a, b) => b.score - a.score);
    response.final_standings = standings;
    response.winner = standings[0].player;
  }

  return res.json(response);
});

module.exports = router;
