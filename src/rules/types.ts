/**
 * Rule Module Type Definitions
 *
 * This is the foundation of CG-Engine. All game logic is externalized
 * via JSON rule modules, never hardcoded into the engine itself.
 *
 * @teaching-point Understanding these types is critical - they define
 * how games express their mechanics to the engine without hardcoding.
 */

/**
 * RuleSchema represents a complete game ruleset loaded as JSON
 *
 * Think of this as your "game design document" in serialized form.
 * The engine reads this schema and knows exactly what that game supports.
 */
export interface RuleSchema {
  /** Unique identifier for this game (e.g., "progressiveRummy") */
  gameId: string;

  /**
   * ValidMoves defines what actions are allowed from each game state
   *
   * This is a STATE MACHINE - it tells the engine what's possible at any point
   * in the game. For example, you can't discard until you've drawn.
   */
  validMoves: ValidMoves;

  /**
   * TurnOrderFunction references which file handles turn order computation
   *
   * Most games use simple circular dealing (player N → player N+1),
   * but some games change direction on tricks or have special conditions.
   * This allows you to swap turn logic without changing core engine code.
   */
  turnOrderFunction: 'circularByPlayerIndex' | TurnOrderFuncPath;

  /** Game-specific discard heap rules (take limits, etc.) */
  discardHeapRules?: DiscardHeapRules;

  /** Reference to win condition evaluation function */
  winCondition: WinConditionSchema;

  /** Optional: name displayed in UI */
  displayName?: string;

  /** Optional: short description shown in lobby/game menus */
  description?: string;
}

/**
 * ValidMoves maps game states to their allowed actions
 *
 * This is the heart of declarative game design. Instead of writing
 * "if player has cards AND can draw THEN allow draw", we declare:
 * "from state DRAW_ALLOWED, you can do [draw, discard]"
 *
 * States are identified by string keys for flexibility and clarity
 */
export interface ValidMoves {
  /** State identifier (engine derives this from current game context) */
  [stateKey: string]: ActionSchema[];
}

/**
 * ActionSchema defines what actions players can take
 */
export type ActionSchema =
  | 'draw'              // Draw from deck
  | 'discard'          // Discard to pile
  | 'takeDiscard'      // Take a card from discard pile (if rules allow)
  | 'declareSet'       // Declare completed set/run
  | 'pass'             // Pass turn/option
  | 'act'              // Act on a pending notification (accept/reject)
  | 'endGame';         // Game ended (win/loss/draw)

/**
 * TurnOrderFuncPath is the path to a custom turn order function
 */
export type TurnOrderFuncPath = './utils/turn-order/circular' | string;

/**
 * DiscardHeapRules governs how cards in discard pile can be taken
 */
export interface DiscardHeapRules {
  /** Maximum cards a player can take from discard heap before restriction */
  maxCardsBeforeRestriction: number;

  /** Can anyone take, or only specific players? */
  allowedToTake: 'any' | 'opponentsOnly';
}

/**
 * WinConditionSchema defines what constitutes winning
 */
export interface WinConditionSchema {
  /** Check if current state is a win for any player */
  checkWin: string;

  /** How to handle tie situations (if applicable) */
  tieBreaker?: 'draw' | 'highestCards';

  /** Number of rounds before game ends in draw (optional) */
  maxRoundsBeforeDraw?: number;
}
