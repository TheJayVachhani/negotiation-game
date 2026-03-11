const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { RESOURCES } = require('../game');

const router = express.Router();

router.post('/', (req, res) => {
  const { game_id, player_name, offer_id, action, give, want, message } = req.body;

  if (!game_id || !player_name || !offer_id || !action) {
    return res.status(400).json({ success: false, error: 'game_id, player_name, offer_id, and action are required' });
  }
  if (!['accept', 'reject', 'counter'].includes(action)) {
    return res.status(400).json({ success: false, error: 'action must be "accept", "reject", or "counter"' });
  }

  const name = player_name.trim();
  const game = db.getGame(game_id);
  if (!game) return res.status(404).json({ success: false, error: `Game "${game_id}" not found.` });
  if (game.status !== 'active') {
    return res.status(400).json({ success: false, error: 'Game is not active.' });
  }

  const offer = db.getOffer(offer_id);
  if (!offer || offer.game_id !== game_id) {
    return res.status(404).json({ success: false, error: `Offer "${offer_id}" not found in game "${game_id}".` });
  }
  if (offer.to_player !== name) {
    return res.status(403).json({ success: false, error: `Offer "${offer_id}" is addressed to "${offer.to_player}", not "${name}".` });
  }
  if (offer.status !== 'pending') {
    return res.status(400).json({ success: false, error: `Offer "${offer_id}" is already ${offer.status}.` });
  }

  if (action === 'reject') {
    db.saveOffer({ ...offer, status: 'rejected' });
    maybeEndGame(game_id);
    return res.json({
      success: true,
      message: `Offer "${offer_id}" rejected. Use negotiation-offer to make your own proposal.`,
      game_id, round: game.round,
    });
  }

  if (action === 'counter') {
    const giveR = {};
    const wantR = {};
    for (const r of RESOURCES) {
      giveR[r] = Math.max(0, parseInt((give || {})[r] || 0));
      wantR[r] = Math.max(0, parseInt((want || {})[r] || 0));
    }

    const me = db.getPlayer(game_id, name);
    for (const r of RESOURCES) {
      if (giveR[r] > me[r]) {
        return res.status(400).json({
          success: false,
          error: `You only have ${me[r]} ${r} but tried to offer ${giveR[r]} in counter-offer.`,
        });
      }
    }

    const counterId = uuidv4().slice(0, 8).toUpperCase();
    db.saveOffer({ ...offer, status: 'countered', counter_offer_id: counterId });
    db.saveOffer({
      id: counterId, game_id, from_player: name, to_player: offer.from_player,
      give_gold: giveR.gold, give_wood: giveR.wood, give_food: giveR.food, give_stone: giveR.stone,
      want_gold: wantR.gold, want_wood: wantR.wood, want_food: wantR.food, want_stone: wantR.stone,
      status: 'pending', message: message || null, created_at: Date.now(),
    });

    const givingStr = RESOURCES.filter(r => giveR[r] > 0).map(r => `${giveR[r]} ${r}`).join(', ') || 'nothing';
    const wantingStr = RESOURCES.filter(r => wantR[r] > 0).map(r => `${wantR[r]} ${r}`).join(', ') || 'nothing';
    return res.json({
      success: true,
      counter_offer_id: counterId,
      message: `Counter-offer sent to ${offer.from_player}: offering ${givingStr} for ${wantingStr}. They must respond with offer_id "${counterId}".`,
      game_id, round: game.round,
    });
  }

  // action === 'accept'
  const fromPlayer = db.getPlayer(game_id, offer.from_player);
  const toPlayer = db.getPlayer(game_id, name);

  for (const r of RESOURCES) {
    if (offer[`give_${r}`] > fromPlayer[r]) {
      return res.status(400).json({
        success: false,
        error: `${offer.from_player} no longer has enough ${r} (has ${fromPlayer[r]}, needs ${offer[`give_${r}`]}). Reject or counter this offer.`,
      });
    }
    if (offer[`want_${r}`] > toPlayer[r]) {
      return res.status(400).json({
        success: false,
        error: `You don't have enough ${r} (you have ${toPlayer[r]}, need ${offer[`want_${r}`]}). Reject or counter this offer.`,
      });
    }
  }

  const updatedFrom = { ...fromPlayer };
  const updatedTo = { ...toPlayer };
  for (const r of RESOURCES) {
    updatedFrom[r] = fromPlayer[r] - offer[`give_${r}`] + offer[`want_${r}`];
    updatedTo[r] = toPlayer[r] + offer[`give_${r}`] - offer[`want_${r}`];
  }
  db.savePlayer(updatedFrom);
  db.savePlayer(updatedTo);
  db.saveOffer({ ...offer, status: 'accepted' });

  const newRound = game.round + 1;
  db.saveGame({ ...game, round: newRound });
  maybeEndGame(game_id);

  const finalGame = db.getGame(game_id);
  const me = db.getPlayer(game_id, name);

  return res.json({
    success: true,
    message: `Trade accepted! You traded with ${offer.from_player}.`,
    game_id,
    round: newRound,
    game_over: finalGame.status === 'finished',
    your_new_resources: { gold: me.gold, wood: me.wood, food: me.food, stone: me.stone },
    tip: finalGame.status === 'finished'
      ? 'Game over! Call negotiation-status to see the final standings.'
      : 'Call negotiation-status to see updated standings and make more trades.',
  });
});

function maybeEndGame(game_id) {
  const game = db.getGame(game_id);
  if (game.status !== 'active') return;
  if (game.round > game.max_rounds) {
    const pending = db.getOffersInGame(game_id).filter(o => o.status === 'pending');
    if (pending.length === 0) {
      db.saveGame({ ...game, status: 'finished', ended_at: Date.now() });
    }
  }
}

module.exports = router;
