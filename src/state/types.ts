/**
 * Core State Type Definitions
 *
 * @teaching-point: This is your GAME STATE - the single source of truth
 * for everything happening in a game. All actions modify this state,
 * and all clients sync to this state.
 */

import type { Card } from '../utils/card-utils';

// Export our own simpler Card interface - card-utils provides the shared shape
export { type Card } from '../utils/card-utils';

/**
 * GameState - The single source of truth for any game session
 *
 * @teaching-point: Notice the immutability pattern here. We never
 * mutate GameState directly - we create new objects with spread/concat.
 * This is critical for multiplayer sync (no race conditions).
 */
export interface GameState {
  /** Unique game identifier */
  gameId: string;

  /** Players in this game (indexed by position, not just names) */
  players: PlayerState[];

  /** Current turn index (0-based, into players array) */
  currentTurnIndex: number;

  /** Cards available to draw from (deck) */
  deck: Card[];

  /** Discarded cards pile (can be taken by other players) */
  discardPile: Card[];

  /** Sets/runs declared by players */
  declaredSets: DeclaredSet[];

  /** Pending notifications for protracted play mode */
  pendingNotifications: PendingNotification[];

  /** Game status (ongoing, ended, awaiting players) */
  status: 'lobby' | 'playing' | 'ended';

  /** Timestamp when game ended */
  endedAt?: Date;

  /** Reason for ending */
  endReason?: 'win' | 'draw' | 'forfeit' | string;

  /** Winner (player index if win) */
  winnerIndex?: number;
}

/**
 * PlayerState represents a single player's information
 *
 * @teaching-point: Notice we track positionIndex separately from playerId.
 * This is crucial - position determines turn order, ID identifies the person.
 */
export interface PlayerState {
  /** Unique player identifier (from auth/Firebase) */
  playerId: string;

  /** Display name shown in game */
  displayName: string;

  /** Player's current position in turn order (0-based index) */
  positionIndex: number;

  /** Player's hand of cards */
  hand: Card[];

  /** Cards laid down as declared sets */
  declaredCards: Card[];

  /** Current game state for this player (can draw, can discard, etc.) */
  playerState: 'waitingToDraw' | 'decidingDiscard' | 'passed' | 'declaringSet';

  /** Is this player currently AFK? */
  isAFK: boolean;

  /** When did player last become active */
  lastActiveAt?: Date;
}

/**
 * DeclaredSet represents a completed set/run declared by a player
 *
 * A set can be either:
 * - A "run" (sequential cards, same suit): 5,6,7,8,9 of Hearts
 * - A "set" (same rank, different suits): 7 of Hearts, Spades, Diamonds
 */
export interface DeclaredSet {
  /** Unique set identifier within this player's sets */
  setId: string;

  /** Cards in this declared set */
  cards: Card[];

  /** Type: 'run' (sequential) or 'set' (same rank) */
  type: 'run' | 'set';

  /** When was this set declared */
  declaredAt: Date;

  /** Which player declared it */
  declaredByPlayerId: string;

  /** Whether this is an initial hand declaration or mid-game */
  isInitialDeclaration: boolean;
}

/**
 * PendingNotification for protracted play mode
 *
 * @teaching-point: This enables the "pass/act" system. When Player A discards,
 * and Player B wants to take it but Player C wants it too, Player B gets a
 * notification with 30 seconds to choose: take the card (accept) or pass.
 */
export interface PendingNotification {
  /** Unique notification ID */
  id: string;

  /** Who is this notification FOR? */
  targetPlayerId: string;

  /** What action is being offered? */
  actionType: 'takeDiscard' | 'acceptDecline' | 'continueTurn';

  /** Context data for the action */
  context: {
    case?: 'takeDiscard' | 'acceptDecline';

    // For takeDiscard
    discardCard?: Card;

    // For acceptDecline
    decliningPlayerId?: string;
    discardingPlayerId?: string;
    discardedCard?: Card;
  };

  /** When this notification expires (player must act) */
  expiresAt: number; // timestamp in ms

  /** Was this notification manually sent or auto-generated? */
  isManual: boolean;
}

/**
 * Simple Card type used throughout the state
 */
export interface Card {
  suit: string;
  rank: number;
  faceUp: boolean;
}

/**
 * GameStateUpdate represents an immutable state update
 *
 * @teaching-point: Notice we never do `state.currentTurnIndex = next` -
 * we return a NEW object. This is essential for:
 * 1. Undo/redo systems (can replay actions)
 * 2. Multiplayer sync (clients can diff only what changed)
 * 3. Time travel debugging (can "rewind" to previous states)
 */
export type GameStateUpdate = Readonly<GameState> & {
  updates: Array<{
    timestamp: number;
    changes: Partial<Pick<GameState, 'currentTurnIndex' | 'discardPile' | ...>>;
  }>;
};
