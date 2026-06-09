/**
 * Card Utility Functions
 *
 * Basic card math and operations used throughout the engine.
 * @teaching-point: These are pure functions - no side effects, easy to test.
 */

import { Card } from '../state/types';

/**
 * Generate a full deck of cards
 *
 * Standard 52-card deck with ranks 2-14 (J,Q,K,A)
 */
export function generateDeck(size: number = 52): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  const deck: Card[] = [];

  for (let i = 0; i < size; i++) {
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

/**
 * Shuffle a card array (Fisher-Yates algorithm)
 *
 * @teaching-point: Notice we return a NEW array, not mutating the input.
 * This is essential for multiplayer sync - no shared mutable state.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]; // Copy to avoid mutation

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Check if a card is an ace or higher face card
 * (J, Q, K, A - used for ranking in many card games)
 */
export function isHighCard(card: Card): boolean {
  return card.rank >= 11; // 11=J, 12=Q, 13=K, 14=A
}

/**
 * Count cards by suit
 */
export function countBySuit(cards: Card[]): Record<string, number> {
  const counts: Record<string, number> = {
    hearts: 0,
    diamonds: 0,
    clubs: 0,
    spades: 0,
  };

  for (const card of cards) {
    counts[card.suit]++;
  }

  return counts;
}

/**
 * Sort a hand of cards by rank (ascending)
 */
export function sortHand(hand: Card[]): Card[] {
  const sorted = [...hand];
  sorted.sort((a, b) => a.rank - b.rank);
  return sorted;
}
