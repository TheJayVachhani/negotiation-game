const express = require('express');
const createRouter = require('./create');
const joinRouter = require('./join');
const startRouter = require('./start');
const statusRouter = require('./status');
const offerRouter = require('./offer');
const respondRouter = require('./respond');

const router = express.Router();

/**
 * POST /api/negotiate
 * Unified endpoint — routes to the correct handler based on `action`.
 * actions: create | join | start | status | offer | respond
 */
router.post('/', (req, res, next) => {
  const { action } = req.body;

  const routes = {
    create: createRouter,
    join: joinRouter,
    start: startRouter,
    status: statusRouter,
    offer: offerRouter,
    respond: respondRouter,
  };

  if (!action) {
    return res.status(400).json({
      success: false,
      error: 'action is required. Valid actions: create, join, start, status, offer, respond',
    });
  }

  const handler = routes[action];
  if (!handler) {
    return res.status(400).json({
      success: false,
      error: `Unknown action "${action}". Valid actions: create, join, start, status, offer, respond`,
    });
  }

  // Rewrite the URL so the sub-router's POST '/' handler matches
  req.url = '/';
  handler(req, res, next);
});

module.exports = router;
