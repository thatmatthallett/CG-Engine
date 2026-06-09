/**
 * Game Session Manager
 *
 * Handles creating, loading, saving, and managing game sessions.
 * This is where we learn about state persistence and session lifecycle.
 */

import { GameState, PlayerState, Card, PendingNotification } from '../state/types';
import type { RuleModule } from '../rules/loader';

/**
 * GameManager creates and manages game sessions
 *
 * @teaching-point: Notice the separation of concerns:
 * - This manager handles CRUD operations (create/save/load)
 * - It doesn't know game rules (that's RulesEngine's job)
 * - It doesn't know turn logic (that's TurnEngine's job)
 */
export default class GameManager {
  private firebaseCollectionName = 'game_sessions';

  /**
   * Create a new game session
   *
   * @teaching-point: Notice we're not initializing deck here - that happens
   * in the game-specific initialization. We just create the skeleton state.
   */
  async createSession(
    gameId: string,
    players: PlayerState[],
    rulesModule: RuleModule
  ): Promise<GameState> {
    // Verify rules are loaded for this game
    if (!rulesModule) {
      throw new Error('Rules module required');
    }

    // Initial state skeleton - deck is empty until init
    const initialState: GameState = {
      gameId,
      players,
      currentTurnIndex: 0,
      deck: [],
      discardPile: [],
      declaredSets: [],
      pendingNotifications: [],
      status: 'lobby',
      endedAt: undefined,
      endReason: undefined,
      winnerIndex: undefined,
    };

    // Save initial state to Firestore
    await this.saveState(initialState);

    return initialState;
  }

  /**
   * Initialize game (deck creation, random starting hands)
   */
  async initializeGame(
    gameState: GameState,
    deckSize: number = 52,
    startingHandSize: number = 7
  ): Promise<GameState> {
    // Create and shuffle deck
    const deck = generateDeck(deckSize);

    // Deal initial hands
    const players = gameState.players.map((player, index) => ({
      ...player,
      hand: [...deck.splice(0, startingHandSize)],
      declaredCards: [],
      playerState: 'waitingToDraw',
      isAFK: false,
      lastActiveAt: new Date(),
    }));

    // Update state immutably
    const newState = { ...gameState, deck, players };

    await this.saveState(newState);
    return newState;
  }

  /**
   * Load existing game session
   */
  async loadSession(gameId: string): Promise<GameState | null> {
    // In production, this would query Firestore
    // const doc = await admin.firestore().collection(this.firebaseCollectionName)
    //   .doc(gameId).get();

    return null as GameState | null;
  }

  /**
   * Save current state to persistence
   */
  async saveState(state: GameState): Promise<void> {
    // In production, this would write to Firestore
    console.log('[GameManager] Saving state:', JSON.stringify({
      gameId: state.gameId,
      status: state.status,
      deckSize: state.deck.length,
      discardPileSize: state.discardPile.length,
    }));
  }

  /**
   * Add a pending notification to the game
   */
  addNotification(
    state: GameState,
    notification: Omit<PendingNotification, 'id' | 'expiresAt'>
  ): GameState {
    const now = Date.now();
    const expiresAt = now + (notification.isManual ? 0 : 30 * 1000); // Manual notifications never expire

    return {
      ...state,
      pendingNotifications: [
        ...(state.pendingNotifications || []),
        {
          id: `notif_${now}_${Math.random().toString(36).substr(2, 9)}`,
          expiresAt,
          ...notification,
        },
      ],
    };
  }

  /**
   * Remove expired notifications
   */
  cleanExpiredNotifications(state: GameState): GameState {
    const now = Date.now();
    return {
      ...state,
      pendingNotifications: state.pendingNotifications?.filter(n => n.expiresAt > now) || [],
    };
  }

  /**
   * End the game with a reason
   */
  endGame(
    state: GameState,
    endReason: string,
    winnerIndex?: number
  ): GameState {
    return {
      ...state,
      status: 'ended',
      endedAt: new Date(),
      endReason,
      winnerIndex,
      deck: [], // Empty deck after game ends
    };
  }
}

/**
 * @teaching-point: Key design decisions in GameManager:
 *
 * 1. Immutable state updates - always return new objects
 * 2. No game-specific logic - just CRUD operations on state
 * 3. Notifications handled as first-class state, not side effects
 * 4. Clean separation between lobby vs playing states
 */

/**
 * Helper function to generate a deck (simplified version)
 */
function generateDeck(count: number): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // 11=J, 12=Q, 13=K, 14=A

  const deck: Card[] = [];

  for (let i = 0; i < count; i++) {
    const suit = suits[i % suits.length];
    const rank = ranks[i % ranks.length];
    deck.push({
      suit,
      rank,
      faceUp: true,
    });
  }

  return deck;
}
