# CG-Engine 🃏

A **multiplayer card game engine** framework supporting both live and protracted play modes.

## What Is CG-Engine?

CG-Engine is a framework for building 2D card games that run in web browsers and mobile apps. It provides:

- **Game Session Management**: Create, persist, and manage multiplayer game sessions
- **Rule Module System**: Load different card games via JSON rules (no hardcoding!)
- **Real-Time Multiplayer**: Live play with turn-based synchronization
- **Protracted Play Mode**: Async games where players can pass/act on notifications

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Game Session                          │
│  - State persistence (Firestore)                         │
│  - Turn order tracking                                   │
│  - Player hand/board management                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Rules Engine (JSON-based)                    │
│  - Load game rules from external modules                  │
│  - Validate moves against state machine                   │
│  - Compute next states                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            Turn Engine & Notification Manager             │
│  - Core game loop (draw → discard → check win)           │
│  - AFK timeout handling                                   │
│  - Pass/Act decision system                               │
└─────────────────────────────────────────────────────────┘
```

## Stack

**Backend:** Node.js + Firebase Functions + Socket.io  
**Frontend:** React (Web) / React Native (Mobile)  
**Storage:** Firestore (persistence) + Supabase Realtime (sync fallback)  
**Push Notifications:** Firebase Cloud Messaging (FCM) Free Tier: 50k/month

## Getting Started

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

## Learning Path - What You'll Learn

This project is designed to teach you game development fundamentals:

1. **State Machines**: Understanding how board games are represented as state transitions
2. **Event-Driven Architecture**: Reactive turn logic and notification handling
3. **Rule Serialization**: Designing externalized game rules (JSON schemas)
4. **Multiplayer Sync Patterns**: Optimistic vs server-authoritative updates
5. **Notification Systems**: AFK timeout + push notification patterns for protracted play

## Core Modules Summary

### Rules Engine (`src/rules/`)
- `loader.ts` - Loads and validates JSON rule modules
- `types.ts` - Rule schema definitions (the foundation!)
- Progressive Rummy is the first game to be implemented against it

### Game Session Manager (`src/game-session/`)
- Creates/loading/saving game state
- Lobby management (waiting for players)
- Turn order tracking

### Turn Engine (`src/turn-engine/`)
- Core game loop: `draw → discard → check win`
- Validates actions via RulesEngine before executing
- Game-agnostic - works with any card game ruleset

### Notification Manager (`src/notifications/`)
- AFKManager: Tracks player activity and detects timeouts
- PassActHandler: Manages pass/act decision flow
- PushService: Sends push notifications via FCM

## Rule Module System Example

```json
// src/rules/examples/progressiveRummy.json
{
  "gameId": "progressiveRummy",
  "validMoves": {
    "initialHandState": ["draw", "discard"],
    "discardPileHasCards": ["takeDiscard", "discard"]
  },
  "turnOrderFunction": "circularByPlayerIndex"
}
```

**Key concept**: All game logic lives in JSON, never hardcoded in engine code!

## Memory Usage Estimate

- **Backend (Node + Firebase)**: ~150-200MB peak with 15 concurrent games
- **Web frontend**: ~2MB bundle size (runs on <64MB devices)
- **Mobile app**: Similar to web, optimized for lower-end devices

Runs easily on Vercel Free Tier or $5 DigitalOcean droplet.

---

*Built as a learning project - feel free to extend it with your own games!*
