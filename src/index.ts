/**
 * CG-Engine - Card Game Engine Framework
 *
 * Main entry point exporting core modules
 */

// Core exports from different engine subsystems
export { default as RulesEngine, RuleModule } from './rules/loader';
export type { RuleSchema, ValidMoves, TurnOrderFunc } from './rules/types';

export { GameState, PlayerState, Card } from './state/types';
export { default as GameManager } from './game-session/manager';
export { TurnEngine } from './turn-engine/index';
export { AFKManager, PassActHandler, PushService } from './notifications/index';

// Utility exports
export { generateDeck, shuffleDeck } from './utils/card-utils';
export { getNextTurnIndex } from './utils/turn-order';
