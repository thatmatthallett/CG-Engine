/**
 * Rule Loading Test - Verifies our architecture works
 *
 * @teaching-point: This demonstrates how we verify the rule loading system
 * works. Notice we're testing that JSON rules load correctly and can be
 * validated against a game state.
 */

import { RulesEngine } from './loader';

describe('Rule Loading System', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine();
  });

  it('should load a simple rule module', async () => {
    const rulesJson = `{
      "gameId": "testGame",
      "validMoves": {
        "default": ["draw", "discard"]
      },
      "turnOrderFunction": "circularByPlayerIndex"
    }`;

    const module = await engine.load(rulesJson);

    expect(module.gameId).toBe('testGame');
    expect(engine.hasGame('testGame')).toBe(true);
  });

  it('should validate moves against loaded rules', async () => {
    const rulesJson = `{
      "gameId": "testGame",
      "validMoves": {
        "drawAllowed": ["draw", "discard"],
        "canTakeDiscard": ["takeDiscard", "discard"]
      }
    }`;

    await engine.load(rulesJson);

    // From draw-allowed state, can draw
    expect(engine.validateMove('testGame', 'drawAllowed', 'draw')).toBe(true);

    // But cannot take discard from that state (not in allowed list)
    expect(engine.validateMove('testGame', 'drawAllowed', 'takeDiscard')).toBe(false);
  });
});
