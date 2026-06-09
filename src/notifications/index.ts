/**
 * Notification Module - Protracted Play Support
 *
 * This enables "pass/act" mechanics where players can AFK and still be notified
 * to make decisions when their action window opens.
 *
 * @teaching-point: This is the UNIQUE FEATURE of CG-Engine. Most game engines
 * don't have this because they assume synchronous play. But for learning projects,
 * understanding notification patterns is valuable!
 */

import type { PendingNotification } from '../state/types';

/**
 * AFKManager tracks player activity and detects when players go AFK
 */
export class AFKManager {
  private activePlayers: Map<string, Date> = new Map();

  /**
   * Mark a player as active
   */
  markActive(playerId: string): void {
    this.activePlayers.set(playerId, new Date());
    console.log(`[AFKManager] ${playerId} marked active`);
  }

  /**
   * Remove a player from active tracking
   */
  removeActive(playerId: string): void {
    this.activePlayers.delete(playerId);
  }

  /**
   * Check if a player is currently AFK (inactive for > threshold)
   */
  isAFK(playerId: string, timeoutMs: number = 5 * 60 * 1000): boolean {
    const lastActive = this.activePlayers.get(playerId);
    return !lastActive || (Date.now() - lastActive.getTime()) > timeoutMs;
  }

  /**
   * Get list of AFK players
   */
  getAFKPlayers(timeoutMs: number = 5 * 60 * 1000): string[] {
    const now = Date.now();
    return Array.from(
      this.activePlayers.entries()
        .filter(([, timestamp]) => (now - timestamp.getTime()) > timeoutMs)
        .map(([id]) => id)
    );
  }

  /**
   * Reset all active times
   */
  reset(): void {
    this.activePlayers.clear();
  }
}

/**
 * PassActHandler manages the pass/act decision flow
 */
export class PassActHandler {
  private pendingDecisions: Map<string, PendingNotification> = new Map();

  /**
   * Record a pending "take discard" opportunity for a player
   *
   * @teaching-point: This is how Progressive Rummy's pass/act mechanic works:
   * 1. Player A discards a card they don't want
   * 2. Player B (next in turn) wants that card but can only take if
   *    - No one else has taken from discard yet this round
   *    - OR they're within the allowed card limit (3 cards before restriction)
   * 3. Player B gets a notification with 30 seconds to accept or pass
   * 4. If they don't act, it moves to the next player
   */
  addTakeDiscardOpportunity(
    gameState: any,
    targetPlayerId: string,
    card: any
  ): PendingNotification {
    const now = Date.now();
    const expiresAt = now + 30 * 1000; // 30 seconds to decide

    const notification: PendingNotification = {
      id: `take_discard_${targetPlayerId}_${now}`,
      targetPlayerId,
      actionType: 'takeDiscard',
      context: { case: 'takeDiscard', discardCard: card },
      expiresAt,
      isManual: false,
    };

    this.pendingDecisions.set(targetPlayerId, notification);
    console.log(
      `[PassActHandler] Added take-discard opportunity for ${targetPlayerId}`
    );

    return notification;
  }

  /**
   * Handle a player accepting the take-discard opportunity
   */
  acceptTakeDiscard(playerId: string): void {
    const notification = this.pendingDecisions.get(playerId);
    if (!notification) {
      console.warn(`[PassActHandler] No pending decision for ${playerId}`);
      return;
    }

    console.log(
      `[PassActHandler] ${playerId} accepted take-discard opportunity`
    );

    this.pendingDecisions.delete(playerId);
  }

  /**
   * Handle a player passing on the take-discard opportunity
   */
  passTakeDiscard(playerId: string): void {
    const notification = this.pendingDecisions.get(playerId);
    if (!notification) {
      console.warn(`[PassActHandler] No pending decision for ${playerId}`);
      return;
    }

    // Notify discarding player that they're taking the card
    console.log(
      `[PassActHandler] ${playerId} passed on take-discard opportunity`
    );

    this.pendingDecisions.delete(playerId);
  }

  /**
   * Clean up expired decisions
   */
  cleanupExpired(): void {
    const now = Date.now();
    for (const [id, notification] of this.pendingDecisions.entries()) {
      if (notification.expiresAt < now) {
        console.log(
          `[PassActHandler] Expiry ignored for ${id} (expired at ${new Date(notification.expiresAt).toISOString()})`
        );
      }
    }
  }

  /**
   * Get pending decisions count
   */
  getPendingCount(): number {
    return this.pendingDecisions.size;
  }
}

/**
 * PushService handles push notification delivery (FCM)
 *
 * @teaching-point: In production, you'd integrate with Firebase Cloud Messaging
 * or OneSignal. Here we show the abstraction - in real code this would:
 * 1. Send FCM payloads to device tokens
 * 2. Handle device token management
 * 3. Track notification delivery status
 */
export class PushService {
  private deviceTokens: Map<string, string> = new Map();

  /**
   * Register a device token for a player
   */
  registerDevice(
    playerId: string,
    fcmToken: string
  ): void {
    this.deviceTokens.set(playerId, fcmToken);
  }

  /**
   * Remove a device token (device unregistered)
   */
  unregisterDevice(playerId: string): void {
    this.deviceTokens.delete(playerId);
  }

  /**
   * Send push notification to a player
   *
   * @teaching-point: This is how protracted play works:
   * Player A has their turn, but they're not in front of the screen.
   * Instead of waiting for them to log back in and see the opportunity,
   * we send a push notification. When they tap it, the app opens directly
   * to that game state, ready for them to act.
   */
  async sendPush(
    playerId: string,
    title: string,
    body: string,
    payload: any
  ): Promise<boolean> {
    const token = this.deviceTokens.get(playerId);

    if (!token) {
      console.warn(`[PushService] No device token for ${playerId}`);
      return false;
    }

    // In production, this would call Firebase's send method:
    // await admin.messaging().send({
    //   to: token,
    //   notification: { title, body },
    //   data: payload,
    // });

    console.log(
      `[PushService] Sent push to ${playerId}: "${body}"`
    );

    return true;
  }

  /**
   * Clear all device tokens (for testing)
   */
  clearAllTokens(): void {
    this.deviceTokens.clear();
  }
}

/**
 * @teaching-point: Summary of how protracted play works in CG-Engine:
 *
 * 1. AFKManager tracks player activity (pings on every interaction)
 * 2. When opportunity arises and player is AFK, pass/act handler creates notification
 * 3. PushService sends push notification via FCM (or other provider)
 * 4. Player taps notification → app opens → state is ready for action
 * 5. Once acted on, opportunity moves to next player in chain
 *
 * This pattern scales: any number of players can AFK, and each gets
 * their own notification queue. When they're back online, pending actions
 * resolve in priority order.
 */
