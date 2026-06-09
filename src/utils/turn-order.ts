/**
 * Turn Order Computation Utilities
 *
 * These functions determine whose turn it is next.
 * Most games use circular dealing (Player N → Player N+1), but some games
 * reverse direction on tricks or have special conditions.
 *
 * @teaching-point: This demonstrates how we separate CORE ENGINE LOGIC
 * from GAME-SPECIFIC logic. The TurnOrderFuncPath in the rules schema points
 * to which function to use for that specific game.
 */

import type { RuleSchema } from '../rules/types';

/**
 * Circular by player index - standard turn order (N → N+1)
 */
export function circularByPlayerIndex(
  currentState: any,
  nextAction?: string
): number {
  // This is a placeholder implementation - actual logic would depend on game rules
  const currentTurnIndex = currentState?.currentTurnIndex ?? 0;
  return (currentTurnIndex + 1) % (currentState?.players?.length ?? 4);
}

/**
 * Reverse turn order (N → N-1)
 */
export function reverseOrder(
  currentState: any,
  nextAction?: string
): number {
  const currentTurnIndex = currentState?.currentTurnIndex ?? 0;
  return (currentTurnIndex - 1 + (currentState?.players?.length ?? 4)) % (currentState?.players?.length ?? 4);
}

/**
 * Load the appropriate turn order function for a game's ruleset
 */
export function loadTurnOrderFunction(
  ruleSchema: RuleSchema
): TurnOrderFuncPath | TurnOrderFunc {
  if (ruleSchema.turnOrderFunction === 'circularByPlayerIndex') {
    return circularByPlayerIndex;
  }

  // For custom functions, just validate and return path string
  const funcPath = ruleSchema.turnOrderFunction as string;
  if (typeof funcPath === 'string') {
    return funcPath;
  }

  throw new Error(`Unknown turn order function: ${ruleSchema.turnOrderFunction}`);
}

/**
 * Type for turn order computation function signature
 */
export type TurnOrderFunc = (currentState: any, nextAction?: string) => number;
