const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { RESOURCES } = require('../game');

const router = express.Router();

router.post('/', (req, res) => {
  const { game_id, player_name, to_player, give, want, message } = req.body;

  if (!game_id || !player_name || !to_player) {
    return res.status(400).json({ success: false, error: 'game_id, player_name, and to_player are required' });
  }

  const fromName = player_name.trim();
  const toName = to_player.trim();

  if (fromName === toName) {
    return res.status(400).json({ success: false, error: 'You cannot make an offer to yourself.' });
  }

  const game = db.getGame(game_id);
  if (!game) return res.status(404).json({ success: false, error: `Game "${game_id}" not found.` });
  if (game.status !== 'active') {
    return res.status(400).json({
      success: false,
      error: game.status === 'lobby'
        ? 'Game has not started yet. Call negotiation-start first.'
        : 'Game has ended. Use negotiation-status to see the final standings.',
    });
  }

  const fromPlayer = db.getPlayer(game_id, fromName);
  if (!fromPlayer) return res.status(403).json({ success: false, error: `You are not in game "${game_id}".` });

  const toPlayer = db.getPlayer(game_id, toName);
  if (!toPlayer) return res.status(404).json({ success: false, error: `Player "${toName}" is not in game "${game_id}".` });

  const giveR = {};
  const wantR = {};
  for (const r of RESOURCES) {
    giveR[r] = Math.max(0, parseInt((give || {})[r] || 0));
    wantR[r] = Math.max(0, parseInt((want || {})[r] || 0));
  }

  for (const r of RESOURCES) {
    if (giveR[r] > fromPlayer[r]) {
      return res.status(400).json({
        success: false,
        error: `You only have ${fromPlayer[r]} ${r} but tried to offer ${giveR[r]}. Check negotiation-status for your current resources.`,
      });
    }
  }

  const totalGive = RESOURCES.reduce((s, r) => s + giveR[r], 0);
  const totalWant = RESOURCES.reduce((s, r) => s + wantR[r], 0);
  if (totalGive === 0 && totalWant === 0) {
    return res.status(400).json({ success: false, error: 'Offer must include at least one resource in give or want.' });
  }

  const offerId = uuidv4().slice(0, 8).toUpperCase();
  db.saveOffer({
    id: offerId, game_id, from_player: fromName, to_player: toName,
    give_gold: giveR.gold, give_wood: giveR.wood, give_food: giveR.food, give_stone: giveR.stone,
    want_gold: wantR.gold, want_wood: wantR.wood, want_food: wantR.food, want_stone: wantR.stone,
    status: 'pending', message: message || null, created_at: Date.now(),
  });

  const givingStr = RESOURCES.filter(r => giveR[r] > 0).map(r => `${giveR[r]} ${r}`).join(', ') || 'nothing';
  const wantingStr = RESOURCES.filter(r => wantR[r] > 0).map(r => `${wantR[r]} ${r}`).join(', ') || 'nothing';

  res.json({
    success: true,
    offer_id: offerId,
    message: `Offer sent! Giving ${givingStr} to ${toName} in exchange for ${wantingStr}. Tell ${toName} to call negotiation-respond with offer_id "${offerId}".`,
    game_id,
    round: game.round,
  });
});

module.exports = router;
