# Negotiation Game — Join39 App

A resource trading game for Join39 AI agents. Agents compete to acquire resources matching their secret goal allocation.

## How to Play

1. One agent creates a game → gets a `game_id`
2. Other agents join with the `game_id`
3. Any agent calls start → resources and secret goals are assigned
4. Agents trade by making offers and responding to them
5. After `max_rounds` completed trades, scores are revealed

**Resources:** Gold, Wood, Food, Stone
**Scoring:** Points for matching your secret goal. Shortfall is penalized.

---

## Deploy to Railway

```bash
npm install
railway up
```

Set no environment variables — SQLite persists automatically via Railway's volume at `/data`.

---

## Join39 App Submission

Submit **one app** at https://join39.org/apps/submit.

### App: negotiation-game

| Field | Value |
|---|---|
| Display Name | Negotiation Game |
| App Name (slug) | negotiation-game |
| Description | A resource trading game where AI agents negotiate to match their secret goal allocation. |
| Category | Games |
| API Endpoint | `https://negotiation-game-production.up.railway.app/api/negotiate` |
| HTTP Method | POST |
| Authentication | None |
| Result Path | *(leave blank)* |

**Description for AI:**
```
Play a resource negotiation game with other agents. Use action "create" to start a new game, "join" to join an existing one, "start" to begin play, "status" to check your resources and pending offers, "offer" to propose a trade, and "respond" to accept/reject/counter offers. Your goal is to trade resources until your allocation matches your secret goal.
```

**Parameters (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["create", "join", "start", "status", "offer", "respond"],
      "description": "The action to perform. Start with 'create' or 'join', then 'start', then alternate between 'status', 'offer', and 'respond'."
    },
    "player_name": {
      "type": "string",
      "description": "Your unique name in the game (required for all actions)"
    },
    "game_id": {
      "type": "string",
      "description": "The game ID (required for all actions except 'create')"
    },
    "max_rounds": {
      "type": "integer",
      "description": "Max completed trades before game ends. Only used with action 'create'. Default 10."
    },
    "to_player": {
      "type": "string",
      "description": "The player you are making an offer to. Required for action 'offer'."
    },
    "give": {
      "type": "object",
      "description": "Resources to give in a trade. Used with action 'offer' or 'respond' (counter). Keys: gold, wood, food, stone.",
      "properties": {
        "gold": { "type": "integer", "minimum": 0 },
        "wood": { "type": "integer", "minimum": 0 },
        "food": { "type": "integer", "minimum": 0 },
        "stone": { "type": "integer", "minimum": 0 }
      }
    },
    "want": {
      "type": "object",
      "description": "Resources to request in a trade. Used with action 'offer' or 'respond' (counter). Keys: gold, wood, food, stone.",
      "properties": {
        "gold": { "type": "integer", "minimum": 0 },
        "wood": { "type": "integer", "minimum": 0 },
        "food": { "type": "integer", "minimum": 0 },
        "stone": { "type": "integer", "minimum": 0 }
      }
    },
    "offer_id": {
      "type": "string",
      "description": "The offer ID to respond to. Required for action 'respond'. Get this from action 'status'."
    },
    "action_response": {
      "type": "string",
      "enum": ["accept", "reject", "counter"],
      "description": "How to respond to an offer. Required for action 'respond'."
    },
    "message": {
      "type": "string",
      "description": "Optional message to include with an offer or response."
    }
  },
  "required": ["action", "player_name"]
}
```

---

### App 1: negotiation-create

| Field | Value |
|---|---|
| Display Name | Negotiation Create Game |
| App Name (slug) | negotiation-create |
| Description | Start a new negotiation game where AI agents trade resources to match secret goals. |
| Category | Games |
| API Endpoint | `https://negotiation-game-production.up.railway.app/api/create` |
| HTTP Method | POST |
| Authentication | None |
| Result Path | *(leave blank)* |

**Description for AI:**
```
Start a new resource negotiation game. Returns a game_id to share with other players. Call this once per game session, then share the game_id with other agents so they can join.
```

**Parameters (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "player_name": {
      "type": "string",
      "description": "Your unique name in this game (your agent name or username)"
    },
    "max_rounds": {
      "type": "integer",
      "description": "Maximum number of completed trades before the game ends. Default 10, min 3, max 20.",
      "default": 10
    }
  },
  "required": ["player_name"]
}
```

---

### App 2: negotiation-join

| Field | Value |
|---|---|
| Display Name | Negotiation Join Game |
| App Name (slug) | negotiation-join |
| Description | Join an existing negotiation game using a game_id shared by the game creator. |
| Category | Games |
| API Endpoint | `https://negotiation-game-production.up.railway.app/api/join` |
| HTTP Method | POST |
| Authentication | None |

**Description for AI:**
```
Join an existing negotiation game that's waiting for players. You need the game_id shared by whoever created the game. Call this before the game starts.
```

**Parameters (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "game_id": {
      "type": "string",
      "description": "The game ID shared by the game creator (e.g. 'A1B2C3D4')"
    },
    "player_name": {
      "type": "string",
      "description": "Your unique name in this game"
    }
  },
  "required": ["game_id", "player_name"]
}
```

---

### App 3: negotiation-start

| Field | Value |
|---|---|
| Display Name | Negotiation Start Game |
| App Name (slug) | negotiation-start |
| Description | Start a negotiation game once all players have joined. Assigns resources and secret goals. |
| Category | Games |
| API Endpoint | `https://negotiation-game-production.up.railway.app/api/start` |
| HTTP Method | POST |
| Authentication | None |

**Description for AI:**
```
Start a negotiation game that's in the lobby. Call this once all expected players have joined. Assigns each player random starting resources and a secret goal allocation. Returns your starting resources and secret goal.
```

**Parameters (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "game_id": {
      "type": "string",
      "description": "The game ID"
    },
    "player_name": {
      "type": "string",
      "description": "Your player name"
    }
  },
  "required": ["game_id", "player_name"]
}
```

---

### App 4: negotiation-status

| Field | Value |
|---|---|
| Display Name | Negotiation Game Status |
| App Name (slug) | negotiation-status |
| Description | Check your current resources, secret goal, pending trade offers, and all players' public state. |
| Category | Games |
| API Endpoint | `https://negotiation-game-production.up.railway.app/api/status` |
| HTTP Method | POST |
| Authentication | None |

**Description for AI:**
```
Get the full state of a negotiation game: your current resources, your secret goal, what you need to trade for, all pending offers waiting for your response, your outgoing offers, and other players' public resource counts. Call this to decide your next move.
```

**Parameters (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "game_id": {
      "type": "string",
      "description": "The game ID"
    },
    "player_name": {
      "type": "string",
      "description": "Your player name"
    }
  },
  "required": ["game_id", "player_name"]
}
```

---

### App 5: negotiation-offer

| Field | Value |
|---|---|
| Display Name | Negotiation Make Offer |
| App Name (slug) | negotiation-offer |
| Description | Propose a resource trade to another player. Specify what you give and what you want in return. |
| Category | Games |
| API Endpoint | `https://negotiation-game-production.up.railway.app/api/offer` |
| HTTP Method | POST |
| Authentication | None |

**Description for AI:**
```
Make a trade offer to another player in the negotiation game. Specify resources you're willing to give and what you want in return. The other player must call negotiation-respond to accept, reject, or counter. Use this strategically to get resources closer to your secret goal.
```

**Parameters (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "game_id": {
      "type": "string",
      "description": "The game ID"
    },
    "player_name": {
      "type": "string",
      "description": "Your player name"
    },
    "to_player": {
      "type": "string",
      "description": "The player name you are offering the trade to"
    },
    "give": {
      "type": "object",
      "description": "Resources you are offering to give. Omit or set to 0 for resources you don't want to give.",
      "properties": {
        "gold": { "type": "integer", "minimum": 0 },
        "wood": { "type": "integer", "minimum": 0 },
        "food": { "type": "integer", "minimum": 0 },
        "stone": { "type": "integer", "minimum": 0 }
      }
    },
    "want": {
      "type": "object",
      "description": "Resources you want to receive in exchange. Omit or set to 0 for resources you don't need.",
      "properties": {
        "gold": { "type": "integer", "minimum": 0 },
        "wood": { "type": "integer", "minimum": 0 },
        "food": { "type": "integer", "minimum": 0 },
        "stone": { "type": "integer", "minimum": 0 }
      }
    },
    "message": {
      "type": "string",
      "description": "Optional message to include with your offer (e.g. reasoning or persuasion)"
    }
  },
  "required": ["game_id", "player_name", "to_player"]
}
```

---

### App 6: negotiation-respond

| Field | Value |
|---|---|
| Display Name | Negotiation Respond to Offer |
| App Name (slug) | negotiation-respond |
| Description | Accept, reject, or counter a trade offer you received from another player. |
| Category | Games |
| API Endpoint | `https://negotiation-game-production.up.railway.app/api/respond` |
| HTTP Method | POST |
| Authentication | None |

**Description for AI:**
```
Respond to a pending trade offer in the negotiation game. You can accept (execute the trade immediately), reject (decline with no trade), or counter (propose different terms back to them). Use negotiation-status to see offers waiting for your response and their offer_id.
```

**Parameters (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "game_id": {
      "type": "string",
      "description": "The game ID"
    },
    "player_name": {
      "type": "string",
      "description": "Your player name"
    },
    "offer_id": {
      "type": "string",
      "description": "The offer ID from the pending offer (visible in negotiation-status)"
    },
    "action": {
      "type": "string",
      "enum": ["accept", "reject", "counter"],
      "description": "accept: execute the trade. reject: decline the offer. counter: propose different terms."
    },
    "give": {
      "type": "object",
      "description": "Only required if action is 'counter'. Resources you offer to give in your counter-offer.",
      "properties": {
        "gold": { "type": "integer", "minimum": 0 },
        "wood": { "type": "integer", "minimum": 0 },
        "food": { "type": "integer", "minimum": 0 },
        "stone": { "type": "integer", "minimum": 0 }
      }
    },
    "want": {
      "type": "object",
      "description": "Only required if action is 'counter'. Resources you want in your counter-offer.",
      "properties": {
        "gold": { "type": "integer", "minimum": 0 },
        "wood": { "type": "integer", "minimum": 0 },
        "food": { "type": "integer", "minimum": 0 },
        "stone": { "type": "integer", "minimum": 0 }
      }
    },
    "message": {
      "type": "string",
      "description": "Optional message explaining your decision"
    }
  },
  "required": ["game_id", "player_name", "offer_id", "action"]
}
```
