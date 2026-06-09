/**
 * Rules Loader - The Bridge Between Game Design and Engine Logic
 *
 * @teaching-point: This component is the most important in CG-Engine.
 * It proves we don't hardcode game logic - instead, we load it as JSON.
 *
 * Think of this like a compiler/parser but for GAME RULES, not code.
 */

import { RuleSchema } from './types';

/**
 * RuleModule represents a loaded rule module (in memory)
 */
export interface RuleModule extends RuleSchema {
  id: string;
  loadedAt: Date;
  version: string;
}

/**
 * RulesEngine validates and loads rule modules
 *
 * This is where we learn about declarative game design:
 * - Rules are external (JSON), not embedded in engine code
 * - Engine doesn't know how any specific game works
 * - Only the rules loader understands a game's mechanics
 */
export default class RulesEngine {
  private loadedRules: Map<string, RuleModule> = new Map();

  /**
   * Load a rule module from JSON
   *
   * @param json The JSON string of the rules module
   * @returns Parsed and validated RuleModule
   *
   * @teaching-point: Notice we validate structure but not behavior.
   * Behavior (game logic) is entirely in the JSON, not here.
   */
  async load(json: string): Promise<RuleModule> {
    const schema = JSON.parse(json) as RuleSchema;

    // Basic validation - we trust our types + simple checks
    if (!schema.gameId) throw new Error('Missing gameId');
    if (!schema.validMoves || typeof schema.validMoves !== 'object') {
      throw new Error('validMoves must be an object mapping states to actions');
    }

    // Load and cache the rule module
    const module: RuleModule = {
      ...schema,
      id: schema.gameId,
      loadedAt: new Date(),
      version: '1.0',
    };

    this.loadedRules.set(schema.gameId, module);
    return module;
  }

  /**
   * Get loaded rules for a game
   */
  get(id: string): RuleModule | undefined {
    return this.loadedRules.get(id);
  }

  /**
   * Validate a move against loaded rules
   *
   * @teaching-point: This is where the rules engine comes alive.
   * We query the rule module to see what actions are valid.
   */
  validateMove(gameId: string, currentState: string, action: string): boolean {
    const rules = this.loadedRules.get(gameId);
    if (!rules) return false;

    const allowedActions = rules.validMoves[currentState];
    if (!allowedActions || !Array.isArray(allowedActions)) return false;

    // Normalize action strings (handle both 'draw' and 'Draw')
    const normalizedAction = action.toLowerCase();
    return allowedActions.includes(normalizedAction) ||
           allowedActions.includes(action.toUpperCase());
  }

  /**
   * Check if a game ruleset is loaded
   */
  hasGame(id: string): boolean {
    return this.loadedRules.has(id);
  }

  /**
   * List all loaded games
   */
  listGames(): string[] {
    return Array.from(this.loadedRules.keys());
  }

  /**
   * Clear all loaded rules (for testing hot-reload)
   */
  clear(): void {
    this.loadedRules.clear();
  }
}

/**
 * @teaching-point: Key takeaways from RulesEngine:
 *
 * 1. We validate structure, not behavior - the JSON owns the logic
 * 2. Rules are cached and reusable (no reload per action)
 * 3. Validation is fast O(1) lookup after initial load
 * 4. This pattern scales to infinite games just by adding JSON files
 */
