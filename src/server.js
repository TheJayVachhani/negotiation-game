const express = require('express');

const app = express();
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'Negotiation Game',
    description: 'A resource trading game for Join39 AI agents',
    version: '1.0.0',
    endpoints: {
      'POST /api/create': 'Create a new game',
      'POST /api/join': 'Join an existing game',
      'POST /api/start': 'Start the game (once all players have joined)',
      'POST /api/status': 'Get game state, your resources, and pending offers',
      'POST /api/offer': 'Make a trade offer to another player',
      'POST /api/respond': 'Accept, reject, or counter an offer',
    },
  });
});

app.use('/api/negotiate', require('./routes/negotiate'));
app.use('/api/create', require('./routes/create'));
app.use('/api/join', require('./routes/join'));
app.use('/api/start', require('./routes/start'));
app.use('/api/status', require('./routes/status'));
app.use('/api/offer', require('./routes/offer'));
app.use('/api/respond', require('./routes/respond'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Negotiation Game server running on port ${PORT}`);
});
