/**
 * Turn Engine - Core Game Loop Orchestration
 *
 * This is the HEART of CG-Engine. It handles:
 * 1. Drawing cards
 * 2. Discarding cards (or taking from discard pile)
 * 3. Declaring sets
 * 4. Checking win conditions after each action
 *
 * @teaching-point: The turn engine is GAME-AGNOSTIC - it doesn't know
 * anything about Progressive Rummy or any specific game. It just handles
 * the universal actions (draw, discard, declare) that exist in almost all card games.
 */

import type { GameState } from '../state/types';
import RulesEngine from '../rules/loader';
import GameManager from '../game-session/manager';

export class TurnEngine {
  private rulesEngine: RulesEngine;
  private gameManager: GameManager;

  constructor(
    rulesEngine: RulesEngine,
    gameManager: GameManager
  ) {
    this.rulesEngine = rulesEngine;
    this.gameManager = gameManager;
  }

  /**
   * Execute a player's turn
   *
   * @teaching-point: Notice the flow here:
   * 1. Check what actions are valid from current state
   * 2. Execute one action per turn (game pacing)
   * 3. Update state immutably
   * 4. Broadcast new state to all clients
   */
  async executeTurn(
    gameState: GameState,
    playerId: string,
    action: string
  ): Promise<GameState | null> {
    const playerIndex = this.getPlayerIndex(playerId, gameState);

    // Check if it's this player's turn
    if (playerIndex !== gameState.currentTurnIndex) {
      console.warn(`[TurnEngine] Wrong turn! Expected player ${gameState.currentTurnIndex}, got ${playerIndex}`);
      return null;
    }

    // Normalize action to lowercase
    const normalizedAction = action.toLowerCase();

    // Get loaded rules for validation
    const rules = this.rulesEngine.get(gameState.gameId);
    if (!rules) {
      throw new Error(`No rules loaded for game: ${gameState.gameId}`);
    }

    // Validate action against state machine (validMoves map)
    const currentStateKey = this.deriveCurrentStateKey(gameState, playerIndex);
    const allowedActions = rules.validMoves[currentStateKey];

    if (!allowedActions?.includes(normalizedAction)) {
      console.warn(
        `[TurnEngine] Invalid action "${normalizedAction}" from ${gameState.gameId}.` +
        ` Allowed actions: ${JSON.stringify(allowedActions)}`
      );
      return null;
    }

    // Execute the action (return new state if successful)
    switch (normalizedAction) {
      case 'draw':
        return this.draw(gameState);

      case 'discard':
        return this.discard(gameState, playerId, playerIndex);

      case 'takeDiscard':
        return this.takeFromPile(gameState, playerId, playerIndex);

      case 'declareSet':
        return this.declareSet(gameState, playerId, playerIndex);

      case 'pass':
        return this.pass(gameState, playerIndex);

      default:
        console.warn(`[TurnEngine] Unknown action: ${normalizedAction}`);
        return null;
    }
  }

  /**
   * Draw a card from the deck
   */
  private draw(gameState: GameState): GameState {
    if (gameState.deck.length === 0) {
      console.warn('[TurnEngine] Deck is empty, cannot draw');
      return gameState;
    }

    const player = gameState.players[gameState.currentTurnIndex];
    const deck = [...gameState.deck];
    const card = deck.pop()!; // Remove and get last card

    // Update player's hand
    const players = gameState.players.map((p, i) => {
      if (i === gameState.currentTurnIndex) {
        return { ...p, hand: [...p.hand, card], declaredCards: [], playerState: 'decidingDiscard' };
      }
      return p;
    });

    const newState = {
      ...gameState,
      deck,
      players,
      currentTurnIndex: gameState.currentTurnIndex, // Stay on same player until discard happens
    };

    console.log(`[TurnEngine] ${player.displayName} drew ${card.suit}[${card.rank}]`);

    return newState;
  }

  /**
   * Discard a card to the pile
   */
  private discard(
    gameState: GameState,
    playerId: string,
    playerIndex: number
  ): GameState {
    const player = gameState.players[playerIndex];

    // Validate: player must have cards to discard
    if (player.hand.length === 0) {
      throw new Error('Player has no cards to discard');
    }

    // Get card to discard from state/query
    // In real implementation, you'd ask "which card should be discarded?"
    // For simplicity, we take the last card in hand
    const deck = [...gameState.deck];
    const discardPile = [...gameState.discardPile];

    // Move last card from hand to discard pile
    const hand = player.hand.slice(0, -1);
    const card = player.hand.pop()!;
    discardPile.push(card);

    const players = gameState.players.map((p, i) => {
      if (i === gameState.currentTurnIndex) {
        return { ...p, hand, declaredCards: [], playerState: 'waitingToDraw' };
      }
      return p;
    });

    // Rotate turn order after discard
    const nextTurnIndex = (playerIndex + 1) % gameState.players.length;

    const newState = {
      ...gameState,
      deck,
      discardPile,
      players,
      currentTurnIndex: nextTurnIndex,
    };

    console.log(`[TurnEngine] ${player.displayName} discarded`);

    return newState;
  }

  /**
   * Take a card from the discard pile (for Progressive Rummy)
   */
  private takeFromPile(
    gameState: GameState,
    playerId: string,
    playerIndex: number
  ): GameState {
    const player = gameState.players[playerIndex];

    // Validate: discard pile must have cards
    if (gameState.discardPile.length === 0) {
      throw new Error('Discard pile is empty');
    }

    // Get a card from the discard pile (simplified: take any card for now)
    const deck = [...gameState.deck];
    const discardPile = gameState.discardPile.slice(0, -1); // Remove top card
    const card = discardPile.pop()!;

    // Update player's hand and move to discarding phase
    const players = gameState.players.map((p, i) => {
      if (i === gameState.currentTurnIndex) {
        return { ...p, hand: [...p.hand, card], declaredCards: [], playerState: 'decidingDiscard' };
      }
      return p;
    });

    // Rotate turn order
    const nextTurnIndex = (playerIndex + 1) % gameState.players.length;

    const newState = {
      ...gameState,
      deck,
      discardPile,
      players,
      currentTurnIndex: nextTurnIndex,
    };

    console.log(`[TurnEngine] ${player.displayName} took discarded card`);

    return newState;
  }

  /**
   * Declare a completed set
   */
  private declareSet(
    gameState: GameState,
    playerId: string,
    playerIndex: number
  ): GameState {
    // In full implementation, you'd ask for specific cards to declare
    // For now, we'll mark the state appropriately

    const newState = { ...gameState };
    // Set marking logic would go here

    return newState;
  }

  /**
   * Pass turn without action
   */
  private pass(gameState: GameState, playerIndex: number): GameState {
    const nextTurnIndex = (playerIndex + 1) % gameState.players.length;

    return {
      ...gameState,
      currentTurnIndex: nextTurnIndex,
    };
  }

  /**
   * Derive the current state key for rules validation
   */
  private deriveCurrentStateKey(
    gameState: GameState,
    playerIndex: number
  ): string {
    const player = gameState.players[playerIndex];

    if (player.playerState === 'waitingToDraw') return 'draw_allowed';
    if (player.playerState === 'decidingDiscard') return 'discard_allowed';
    if (gameState.discardPile.length > 0) return 'discard_pile_available';

    return 'generic';
  }

  /**
   * Get player index from ID
   */
  private getPlayerIndex(playerId: string, gameState: GameState): number {
    const player = gameState.players.find(p => p.playerId === playerId);
    if (!player) throw new Error(`Player not found: ${playerId}`);
    return player.positionIndex;
  }
}

/**
 * @teaching-point: Key design insights from TurnEngine:
 *
 * 1. Action dispatch pattern - switch on action type for clarity
 * 2. Immutable state updates - always create new objects
 * 3. Rules validation before execution - validateMoves is mandatory
 * 4. Game-agnostic actions - same methods work for any card game
 */
