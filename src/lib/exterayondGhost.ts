/**
 * Ghost Mode — the suppression state and its decisions, ported from
 * exteraless @8b7ec40: the ghost block of `NekoConfig.java` (the five
 * essentials, their locks, `isGhostModeActive`/`setGhostMode`) and
 * `AyuGhostUtils.interceptRequest` (which request kinds each flag withholds
 * or rewrites), plus the send-pipeline consumers of that same interceptor
 * (`handleReadAfterSend` / `handleOfflineAfterSend` — GHOST-07/GHOST-06) and
 * the two send-parameter keys the ghost screen hosts from `NaConfig`
 * (`silentMessageByDefault` / `ghostScheduledSend` — GHOST-08/09).
 * Client-side suppression only: the client withholds or rewrites its own
 * outgoing read-receipt / typing / status / story packets, exactly as the
 * Android client does at the same call level — nothing here claims to unsend
 * a packet or to change what the server learned before the mode was on.
 *
 * The module is worker-safe (no DOM, no Solid): the gating managers run in
 * the shared worker, and the tab-side settings store pushes the flags through
 * `appMessagesManager.setExterayondGhostFlags` — the `setSortByUnread`
 * pattern (once per account session on `user_auth`/`account_switched`, and
 * on every change). Android has no per-flag aliases in `EtgBackup`, so no
 * `.extera` keys exist for any of them.
 */

export type ExterayondGhostFlags = {
  /** Android `NekoConfig.sendReadMessagePackets` (default true) — GHOST-02. */
  sendReadMessagePackets: boolean,
  /** Android `NekoConfig.sendReadStoriesPackets` (default true) — GHOST-03. */
  sendReadStoriesPackets: boolean,
  /** Android `NekoConfig.sendOnlinePackets` (default true) — GHOST-04. */
  sendOnlinePackets: boolean,
  /**
   * Android `NekoConfig.sendUploadProgress` (default true) — GHOST-05. At the
   * pinned revision the flag blocks `messages.setTyping` entirely
   * (`AyuGhostUtils.interceptRequest` accepts only `TL_messages_setTyping` /
   * `TL_messages_setEncryptedTyping` under this branch), which covers both
   * typing indicators and upload-progress actions.
   */
  sendUploadProgress: boolean,
  /**
   * Android `NekoConfig.sendOfflinePacketAfterOnline` (default false) —
   * GHOST-06: after a message-send request completes, go offline again
   * (the send-pipeline hook, packet 084).
   */
  sendOfflinePacketAfterOnline: boolean,
  /**
   * Android `NekoConfig.markReadAfterSend` (default true) — GHOST-07: when a
   * message-send request goes out while read receipts are suppressed, mark
   * the dialog read on the server (the send-pipeline hook, packet 084). Not
   * a master-toggle essential — Android keeps it a standalone config outside
   * `ghostToggleItems`; it rides the worker push because the send hook reads
   * it worker-side.
   */
  markReadAfterSend: boolean,
  /**
   * Android `NaConfig.silentMessageByDefault` ("SilentMessageByDefault",
   * default false) — GHOST-08: outgoing messages send without sound unless
   * the send was explicit about it (Android passes `!silentMessageByDefault`
   * as `notify` at every send call site; the flipped send-menu item is the
   * explicit escape). A standalone Na key hosted by GhostModeActivity that
   * rides the worker push because the send invokes read it worker-side.
   */
  silentMessageByDefault: boolean,
  /**
   * Android `NaConfig.ghostScheduledSend` ("GhostScheduledSend", default
   * false) — GHOST-09: while online packets are suppressed, ordinary sends
   * are re-routed through the scheduled-send primitive 12 seconds ahead (the
   * server delivers them later without the sender-online side effect).
   * Another standalone Na key hosted by GhostModeActivity, worker-side for
   * the same reason.
   */
  ghostScheduledSend: boolean
};

/** Android `NekoConfig`/`NaConfig` ghost-screen defaults: every packet sends (stock behavior). */
export const GHOST_FLAG_DEFAULTS: ExterayondGhostFlags = {
  sendReadMessagePackets: true,
  sendReadStoriesPackets: true,
  sendOnlinePackets: true,
  sendUploadProgress: true,
  sendOfflinePacketAfterOnline: false,
  markReadAfterSend: true,
  silentMessageByDefault: false,
  ghostScheduledSend: false
};

/** The master-toggle keys, `NekoConfig.ghostToggleItems`' order. */
export const GHOST_ESSENTIAL_KEYS: readonly (keyof ExterayondGhostFlags)[] = [
  'sendReadMessagePackets',
  'sendReadStoriesPackets',
  'sendOnlinePackets',
  'sendUploadProgress',
  'sendOfflinePacketAfterOnline'
];

/**
 * A flag's value counts as the ghost state when it equals
 * `(key === 'sendOfflinePacketAfterOnline')` — the one essential whose ghost
 * value is `true` (NekoConfig.isGhostModeActive/setGhostMode's comparison).
 */
export const isFlagInGhostState = (key: keyof ExterayondGhostFlags, value: boolean): boolean =>
  (key === 'sendOfflinePacketAfterOnline') === value;

/**
 * Android `NekoConfig.isGhostModeActive`: every UNLOCKED essential sits in
 * its ghost state. Locked flags are skipped entirely — a flag locked in its
 * non-ghost value does not deactivate the mode (and a fully locked set is
 * vacuously active).
 */
export const isGhostModeActive = (
  flags: ExterayondGhostFlags,
  locked: Partial<Record<keyof ExterayondGhostFlags, boolean>> = {}
): boolean => {
  for(const key of GHOST_ESSENTIAL_KEYS) {
    if(locked[key]) continue;
    if(!isFlagInGhostState(key, flags[key])) {
      return false;
    }
  }

  return true;
};

/**
 * Android `NekoConfig.setGhostMode`'s target for one flag:
 * `(item == sendOfflinePacketAfterOnline) == enabled`.
 */
export const ghostModeTarget = (key: keyof ExterayondGhostFlags, enabled: boolean): boolean =>
  (key === 'sendOfflinePacketAfterOnline') === enabled;

/**
 * Android `NekoConfig.setGhostMode`: unlocked essentials move to their ghost
 * (enabled) or stock (disabled) targets; locked ones keep their values.
 */
export const applyGhostMode = (
  flags: ExterayondGhostFlags,
  locked: Partial<Record<keyof ExterayondGhostFlags, boolean>>,
  enabled: boolean
): ExterayondGhostFlags => {
  const next = {...flags};
  for(const key of GHOST_ESSENTIAL_KEYS) {
    if(!locked[key]) {
      next[key] = ghostModeTarget(key, enabled);
    }
  }

  return next;
};

/**
 * GHOST-02: read receipts (`messages.readHistory`, `channels.readHistory`,
 * `messages.readDiscussion`, `messages.readMessageContents`,
 * `channels.readMessageContents`; `messages.getMessagesViews` is rewritten to
 * `increment = false` instead of blocked). Android's secret-chat
 * `messages.readEncryptedHistory` has no web counterpart — Web K implements
 * no secret chats.
 */
export const ghostSuppressesReadReceipts = (flags: ExterayondGhostFlags): boolean =>
  !flags.sendReadMessagePackets;

/**
 * GHOST-03: story reads (`stories.readStories`, `stories.incrementStoryViews`).
 */
export const ghostSuppressesStoryReads = (flags: ExterayondGhostFlags): boolean =>
  !flags.sendReadStoriesPackets;

/**
 * GHOST-04: the outgoing `account.updateStatus` rewrite. With
 * `sendOnlinePackets` off, Android does not block the request — it forces
 * `offline = true` (`interceptRequest`), so the status pings keep flowing and
 * keep announcing offline. The local self status follows what the server is
 * told (Android's self status cells show offline while the flag is on).
 */
export const ghostStatusToAnnounce = (offline: boolean, flags: ExterayondGhostFlags): boolean =>
  flags.sendOnlinePackets ? offline : true;

/**
 * GHOST-05: typing/upload progress (`messages.setTyping` in full — see the
 * flag's doc above).
 */
export const ghostBlocksTyping = (flags: ExterayondGhostFlags): boolean =>
  !flags.sendUploadProgress;

/**
 * The web request kinds of Android `AyuGhostUtils.isMessageSendRequest`
 * (GHOST-07's consumers) — the send invokes of `appMessagesManager`. The
 * secret-chat sends of `isOnlineRequest` have no web counterpart (Web K
 * implements no secret chats); `messages.editMessage` is an online request
 * for GHOST-06 only, exactly like Android's tables.
 */
export type ExterayondGhostSendMethod =
  | 'messages.sendMessage'
  | 'messages.sendMedia'
  | 'messages.sendMultiMedia'
  | 'messages.forwardMessages'
  | 'messages.sendInlineBotResult'
  | 'messages.sendScheduledMessages'
  | 'messages.editMessage';

/** Android `isMessageSendRequest` — GHOST-07's read-after-send kinds. */
const GHOST_MESSAGE_SEND_METHODS: readonly ExterayondGhostSendMethod[] = [
  'messages.sendMessage',
  'messages.sendMedia',
  'messages.sendMultiMedia',
  'messages.forwardMessages',
  'messages.sendInlineBotResult',
  'messages.sendScheduledMessages'
];

/** Android `isOnlineRequest` minus the secret-chat sends — GHOST-06's kinds. */
const GHOST_ONLINE_METHODS: readonly ExterayondGhostSendMethod[] = [
  ...GHOST_MESSAGE_SEND_METHODS,
  'messages.editMessage'
];

/**
 * GHOST-06: `AyuGhostUtils.handleOfflineAfterSend` — the request is a
 * send/edit whose completion is followed (after
 * `GHOST_OFFLINE_AFTER_SEND_DELAY`) by an offline status packet.
 */
export const ghostOfflineAfterSendApplies = (method: ExterayondGhostSendMethod, flags: ExterayondGhostFlags): boolean =>
  flags.sendOfflinePacketAfterOnline && GHOST_ONLINE_METHODS.includes(method);

/**
 * GHOST-07: `AyuGhostUtils.handleReadAfterSend` — with read receipts
 * suppressed, a message-send request marks the dialog read on the server
 * right away (the bypass Android gets from the one-shot
 * `AyuState.setAllowReadPacket(true, 1)`).
 */
export const ghostReadAfterSendApplies = (method: ExterayondGhostSendMethod, flags: ExterayondGhostFlags): boolean =>
  flags.markReadAfterSend && !flags.sendReadMessagePackets && GHOST_MESSAGE_SEND_METHODS.includes(method);

/**
 * GHOST-08: `NaConfig.silentMessageByDefault` decides the outgoing `notify`
 * parameter at every Android send call site (`!getSilentMessageByDefault()
 * .Bool()`): no explicit choice means the flag's value, an explicit one
 * wins. `explicit === undefined` is the composer's "this press chose
 * nothing" — with the flag off it passes through untouched, so the stock
 * invoke is byte-for-byte the same.
 */
export const ghostSilentByDefault = (explicit: boolean | undefined, flags: ExterayondGhostFlags): boolean | undefined =>
  flags.silentMessageByDefault ? explicit ?? true : explicit;

/**
 * GHOST-09: Android `SendMessagesHelper.shouldSendAsGhostScheduled`'s config
 * condition and the payload exclusions that have a web surface. The trick
 * needs ghost-scheduled send on AND online packets suppressed — with online
 * packets flowing there is nothing to hide. The other Android exclusions
 * (`retryMessageObject`, `sendingStory`, `invoice`, `game`, quick replies)
 * have no web surface at these send functions or return earlier; the peer
 * checks (self, bots) live in the manager.
 */
export const ghostScheduledSendApplies = (flags: ExterayondGhostFlags, payloadExcluded: boolean): boolean =>
  flags.ghostScheduledSend && !flags.sendOnlinePackets && !payloadExcluded;

/** Android `SendMessagesHelper`: `scheduleDate = getCurrentTime() + 12`. */
export const GHOST_SCHEDULED_SEND_DELAY_SECONDS = 12;

/** Android `AyuGhostUtils.OFFLINE_DELAY_MS`. */
export const GHOST_OFFLINE_AFTER_SEND_DELAY = 1000;

/**
 * The worker-side state. The tab-side store is the single writer (through
 * `setExterayondGhostFlags`); the managers only read.
 */
let ghostFlags: ExterayondGhostFlags = {...GHOST_FLAG_DEFAULTS};

export const setExterayondGhostFlags = (flags: ExterayondGhostFlags) => {
  ghostFlags = {...flags};
};

export const getExterayondGhostFlags = (): ExterayondGhostFlags => ghostFlags;
