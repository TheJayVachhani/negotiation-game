/**
 * Simple in-memory store with JSON file persistence.
 * No native compilation required — works on all platforms.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'db.json');

// In-memory state
let state = {
  games: {},   // game_id -> game object
  players: {}, // `${game_id}::${player_name}` -> player object
  offers: {},  // offer_id -> offer object
};

// Load persisted state on startup
if (fs.existsSync(DB_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.warn('Could not load db.json, starting fresh:', e.message);
  }
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

const db = {
  // Games
  getGame: (id) => state.games[id] || null,
  saveGame: (game) => { state.games[game.id] = game; save(); },

  // Players
  playerKey: (game_id, player_name) => `${game_id}::${player_name}`,
  getPlayer: (game_id, player_name) => state.players[`${game_id}::${player_name}`] || null,
  getPlayersInGame: (game_id) => Object.values(state.players).filter(p => p.game_id === game_id),
  savePlayer: (player) => { state.players[`${player.game_id}::${player.player_name}`] = player; save(); },
  saveAllPlayers: (players) => { players.forEach(p => { state.players[`${p.game_id}::${p.player_name}`] = p; }); save(); },

  // Offers
  getOffer: (id) => state.offers[id] || null,
  getOffersInGame: (game_id) => Object.values(state.offers).filter(o => o.game_id === game_id),
  saveOffer: (offer) => { state.offers[offer.id] = offer; save(); },
};

module.exports = db;
