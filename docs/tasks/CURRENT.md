# Current state and session handoff

This is the entry point for a new session without conversation history. Read
the root [AGENTS.md](../../AGENTS.md), this file, and the
[feature checklist](../exterayond-feature-checklist.md). Inspect `git status`
and the relevant code before making changes. The checklist, not this note, is
the source of truth for completion counts and pending feature IDs.

## Priority

**Layout note (2026-11-02):** the unit suite lives at a root `tests/` (moved
from `src/tests/`) and the Playwright browser suites at `tests/browser/`
(moved from the root `e2e/`); the `e2e` name now belongs only to the
end-to-end encryption module `src/lib/calls/e2e/`. See packet 058 in
[progress.md](progress.md) before grepping for old paths.

As of 31 October 2026, Forced MD3 remains the pending-priority block: its
eight-part settings group (packet 065 added the ninth, independent modal
chrome part), the base web adaptations and the MD3 player's
style settings exist, but desktop visual review is blocked (no browser in
the autonomous sessions). Read [task 028](028-forced-md3.md) and the last
sections of [progress.md](progress.md). Do not mark LOOK-18–23 or the PLAYER
entries complete merely because their controls exist — the player style rows
(PLAYER-02..05, 08..10, 12, 15..17) are implemented with regression tests
but their CSS result is unreviewed. PLAYER-01's remaining subsystem (queue,
lyrics, gestures, block order, cover colors, background modes) waits on
missing web primitives and was not faked.

The 037–043 packets worked the unchecked Chats/Appearance list instead:
HIDE-08 (hide the channel plate's gift button), CHAT-21 (disable global
search in the chat list search), the resolved audit entries HIDE-13 and
HIDE-11 (the web attach menu has neither a camera tile nor a money item),
HIDE-05 (hide the "All chats" folder tab with live reshaping and the
`hideAllChats` backup alias), LOOK-05 + LOOK-08 (centered header title and
system fonts), CHAT-40 (wide channel posts, with the CHAT-41 verdict), and
CHAT-35 (the web repeat action with its confirmation — the runbook gained
the matching acceptance steps), and packet 044 closed GEN-12 (sort by
unread: `SortByUnread`, worker-side dialog index layout with live
re-sorting). The checklist count is 59/296.

**Active side stream — look & feel** (user-directed, see
[`look-and-feel.md`](look-and-feel.md)): packets 045–048 worked the V entries
to completion (V-1 wallpaper pattern gate, V-2 attached sidebar, V-4 theme
palette + accent picker, V-3 the Forced MD3 audit), packet 049 the user's
acceptance round 1 (F-1..F-6), and packet 050 the acceptance round 2
(G-1..G-4): a "Set a color" pick applies in the same task (background
re-applies run `applyThemeFast`, no theme-switch view transition) and the
palette tint chain is explicit and tested — explicit background color >
explicit accent PICK > wallpaper-derived > the theme's own accent; the hub
gained real, level-gated motion (eased row/summary hover-press, cross-engine
reveal fades — the F-6 reveal's instant open off Chromium 131+ was the
finding); the attached sidebar rounds only its content-facing edge, never
overlays the chat (the visual-width space math in `updateColumnWidths` plus
the `#column-center` re-centering, both mirrored in RTL); and an image
wallpaper's dominant color (JS canvas sampling in the background renderer,
cached, announced on `exteraless_wallpaper_tint`) drives the chrome while
the palette toggle is on, re-derived on every wallpaper change. All four V
entries remain checked in the checklist's user-directed section; the visual
results await the user's re-acceptance — runbook steps 1.22–1.23 in batch 1
of [`../verification.md`](../verification.md) were rewritten for the new
behavior (1.21 and 1.24 are unchanged).

**Priority override — the user's real config (2026-11-01).** The user
provided their Android settings export and directed that the port cover
their actually-used settings before any catalog order. Worked in packets
052–057 (2026-11-02): **Pill Stack** — the four `PillStackConfig` keys
verbatim, the web registry with the cache pill really backed (PILLS-01/06/12
done; PILLS-02/03/04 carry the machinery with the remaining piece recorded;
PILLS-05/07..11 carry class verdicts), **the main menu layout** —
`OEAppearanceMainMenuLayout` consumed over the burger menu with the hub
screen and the `.extera` halves (FOLD-11/13 done; FOLD-10/12 annotated), the
**W-entries** — showAddToSavedMessages, CopyPhoto, showReport wired into the
message menu (W-1..W-3), bubbleRadius over the bubble corners (W-6), the
decoration effects' class verdict (W-7), showMessageDetails/showViewHistory
stored as documented no-ops (W-4/W-5); the catalog-covered keys (HidePhone,
ZalgoFilter, UseEditedIcon, HideTimeForSticker, stickerSize) verified
against the Android defaults, LOOK-05 covers the user's
CenterActionBarTitleType=1, the camera/boost/icon-pack/autoNight keys carry
class-3 verdicts with reasons, `localPremium` stays parked (OTHER-04,
user's call). Defaults always come from the Android source; the private
export sets priorities only and is never committed. The checklist count is
64/296 plus the user-directed sections.

Packet 058 (2026-11-02) was a bug-hunt over those surfaces: four proven
defects fixed with tests — the theme palette's restore-on-clear poisoned
across theme switches (and the light-theme path), the boot night-class
observer consumed by the platform classes before the first theme apply, the
cache pill's unhandled rejection where CacheStorage is unavailable, the main
menu hub being inert on a fresh client with the first toggle collapsing the
menu, and the W-3 showReport broadening dead behind a truthy-Promise
short-circuit. bubbleRadius and the W-1/W-2 verifies audited clean; five
visual findings await the user's acceptance (progress.md, packet 058). Note:
this pass edited the worktree content of two `tests/` files that are staged
adds of the parallel session's `src/tests → tests/` move (paths untouched)
and updated one untracked test file — see the packet 058 disclosure before
committing the move.

Packets 059–063 (2026-11-02, this run) worked the annotated
"implementation exists, completeness to be verified" entries and the
named candidates: **LOOK-01/02** — the avatarCorners slider now scales
forum avatars (Android's CORNER_TYPE_FORUM 42/64) with a new
`--oe-avatar-radius-forum`, the single-corner toggle unifies the shapes;
**LOOK-11/12** — the section-radius audit stands, separateHeaders gained
its missing regression tests (the Section component's `.is-separated`
gate, M3 list items force it); **GEN-01** — verdict recorded (the web's
translate popup is the sheet analog; the inline pipeline is TRANS-05
territory, no switch without two states); **CHAT-37** — the strip now
reaches native navigation: `stripAnchorTracking` rewrites external
anchors' href before the browser's default action (click and middle
click, pre-confirm like Android), with boot preload and the unloaded
fallback — implemented-but-unreviewed, awaiting the user's click-path
acceptance; **FOLD-10/12** — the hub Main Menu editor gained reorder
(up/down buttons, the desktop stand-in for Android's drag) and divider
add/remove/move; **CHAT-26** — poll results before voting audited
complete, the gate extracted into a tested predicate.

Packets 065–066 (2026-11-04) shipped **the ninth MD3 part** and
**MEDIA-10**: `OEAppearanceMd3Dialogs` (packet 065) is the web-side modal
chrome toggle — popup/dialog cards, context-menu cards and the search
field take the M3 tonal surfaces behind the `oe-md3-dialogs` root class,
as an independent hub row outside the eight-part master's x/8 count;
`ShowSmallGIF` (packet 066, MEDIA-10) renders standalone chat GIFs inside
the compact dp(120) box through `gifMediaBox` → `wrapVideo` →
`wrapPhoto` → `setAttachmentSize`'s new `noMinSize`. Both are off =
stock byte-for-byte, both carry decision-logic tests and runbook steps
(1.25, 5.24); both await the user's visual acceptance. The checklist
count is 74/296 (MEDIA-10 checked; the ninth MD3 part lives under the
checked V-3 entry) plus the user-directed sections.

Packets 070–072 (2026-11-05) worked the menu compositions and the
verdict-only rows: **070** wired the menu composition toggles where the web
menus actually carry the item — MENU-03's `ChatMenuItemBoostGroup` /
`ChatMenuItemLinkedChat` over the chat header menu's boost and View
Discussion rows, MENU-05's `Reactions` / `CopyLink` / `AddToFavorites` over
the message context menu's reactions strip, Copy Message Link and the
favorites add-direction (8 of Android's 24 with real handlers counting the
already-wired W-1/W-2/CHAT-35/W-3; showTranslate is unwirable — Android's
item is a fork addition, the web's is stock) — MENU-04's icon-row verdict
recorded, the other keys annotated per-key with their reasons; all three
entries stay unchecked (partial/verdict). **071** recorded CHAT-12/13 as
class 3: the rows only disable Android's stock pull-down-to-next-chat
transition (`ChatPullingDownDrawable`), which Web K does not implement; no
keys, no EtgBackup aliases. **072** recorded EMOJI-01 as documented
equivalence (the web renders standard emoji through the system emoji font
stack permanently; Telegram's image set waits on an emoji-image primitive)
and LOOK-04's precise blocker (the chat list header has no title element —
`index.html` + `sidebarLeft/index.ts` verified; a web variant would be
parallel UI). No code in 071/072. Checklist count unchanged (74/296); the
hub gained the "Chat menu" section and four "Message menu" rows; runbook
5.25 appended.

After that, pick unchecked items from the checklist, generally small to
large. Packets 074–075 (2026-11-05) worked the mini-player and the remaining
menu compositions: **074** wired the mini-player rows whose Android keys
have a real surface over the pinned-audio plate (`chat/audio.tsx`) —
PLAYER-22 `OEPlayerMiniCover` (rounded/round/hidden artwork), PLAYER-23
`OEPlayerMiniShape` (rounded/pill/square card), PLAYER-24
`OEPlayerMiniProgress` (only "none" removes the line — ring/border have no
web surface), PLAYER-27 `OEPlayerMiniArtist`, PLAYER-29 `OEPlayerMiniNext`,
PLAYER-30 `OEPlayerMiniClose` — with PLAYER-21/25/26 class-3 verdicts and
PLAYER-28 (default false over a stock web button) unstored; the hub gained
the Appearance tab's "Mini player" section. **075** wired MENU-06's eight
`Text*` keys over the composer formatting tooltip (`chat/markupTooltip.ts`,
`FORMAT_TOOLTIP_TOGGLE_KEYS` in the store), MENU-07's
`MediaViewerMenuItemForward` over the media viewer's more-menu Forward row,
and MENU-08's `ActionBarButtonForward` over the selection bar's forward
button; MENU-02 and MENU-09 are verdicts (no separate key / the delete-sheet
presets have no web counterpart — `DeleteChatForBothSides` already carries
the revoke preselection), and the hub's Chats tab gained "Text Style",
"Media Viewer Menu" and "Action Bar Buttons". All new rows await the user's
visual acceptance (runbooks 5.26 and 5.27); the player rows stay unchecked
per the established convention. Checklist count unchanged (74/296).

Pick unchecked items from the checklist and verify against the Android
source per packet. Packets 077–078 (2026-11-05) closed the mini-player
candidates: **077** wired PLAYER-06 — `OEPlayerCoverSwipe` drives the MD3
popup's cover drag (the pointer mechanics byte-ported into the tested
`md3PlayerCoverSwipe.ts`: 8px slop arm with origin reset, dx/dp(40) tilt on
the non-disc covers, dp(420) fade, the dp(70) release switching next left /
previous right, spring-back and slide-out at Android's 450/180ms easings;
reduced motion crossfades, animations-off switches at once; off = the stock
cover, no touch-action change) with the hub row framed-cover-only like the
Android editor, runbook 5.28, implemented-but-unreviewed. **078** recorded
MEDIA-11 as class 3 (Web K has no double-tap seek to re-step — the player's
desktop dblclick toggles full-screen) and PLAYER-14 as nothing-to-re-locate
(`OEPlayerShowActions` re-locates Android's speed/lyrics/queue between the
actions group and the overflow menu; the web popup has neither surface).
No code in 078. Checklist count unchanged (74/296).

Packet 080 (2026-11-05) recorded GEN-08..GEN-11 as class 3 (web file
engine has no speed levels or min-chunk knob; downloads are browser-owned,
so no save-path/subfolder surface exists). **Packet 080b** landed the
packet-079 follow-up: the hub's `.extera` import toast now names the
unsupported Android-only keys (`backupImportReport` in
`src/lib/exteraBackup/etgBackup.ts` — one toast, the applied count travels
inside it; runbook 6.3). **Packets 081–082 (2026-11-05) started the Ghost
Mode subsystem** — chosen over Translation for self-containedness (pure
client-side suppression at manager chokepoints the web owns, no
providers/CORS/keys; PILLS-08 waits on GHOST-01). The Android contract
(`NekoConfig` ghost block + `AyuGhostUtils.interceptRequest` @8b7ec40) lives
in the worker-safe `src/lib/exterayondGhost.ts`; the store gained the ten
Android-named keys (five essentials + five locks) pushed worker-side like
the GEN-12 flag; the gates: `readHistory`/`readMessages` skip the server
call without latching, `setTyping` blocks whole, `incrementMessageViews`
rewrites `increment=false`, `updateMyOnlineStatus` rewrites to offline
(never drops), `readStories`/`incrementStoryViews` skip. The hub's Other tab
gained the "Ghost Mode" section — master toggle with the x/5 counter, the
five essentials in Android's wording, explicit lock buttons as GHOST-12's
desktop analog (four-cap). Checklist count **80/296** (GHOST-01..05 +
GHOST-12 checked). Ghost's remaining rows (offline-after-send,
mark-read-after-send, silent-by-default, scheduled-send, drawer item, status
indicator) wait on the send-pipeline hook and two small UI wirings —
annotated per entry, never faked. Runbook batch 7 / step 7.1 appended; the
suppression's observable half needs the user's second account.

**Packet 084b (2026-11-05) landed the send-pipeline hook and GHOST-06/07**:
`appMessagesManager.exteraGhostSendHook` is the documented "message went
out" point (ten wrapped send/edit invoke sites; stock flags = pass-through),
GHOST-06 sends the offline packet ~1s after each send settles, and
GHOST-07's "Read on Interact" row (Android's standalone key, default true)
marks the dialog read on the server right at send time when read receipts
are suppressed — the direct-invoke port of Android's `allowReadPacket`
bypass. Runbook 7.3 appended (second-account checks). Checklist count
**82/296**.

**Packet 085 (2026-11-05) started the translation subsystem** — TRANS-05's
foundation: `src/lib/exterayondTranslate.ts` (the exact MessageHelper ports
of the translator-mode decisions), the `translatorMode` key (0..2, default
off), the General tab's "Translate" section with the mode selector, and the
first wired consumer — the translate popup's copy, which under Manual Only/
On carries `original + separator + translation` like Android's `startTrans`
takeaway (off = stock copy). The inline-into-message pipeline stays the
annotated long tail (TRANS-02..14 wait on a web bubble-render primitive).
Runbook 5.29 appended.

**Packet 087 (2026-11-13) closed the Ghost screen's rest — GHOST-08..11**:
GHOST-08's `silentMessageByDefault` decision wraps the `silent` field of all
seven send invokes (off = byte-for-byte stock) and flips the composer's send
menu to "Send with Sound" while on; GHOST-09's `ghostScheduledSend` re-routes
ordinary sends as scheduled `serverTime + 12` while online packets are
suppressed (self/bots/stars/explicit schedules excluded, Android's exact
`shouldSendAsGhostScheduled` semantics); GHOST-10 puts the ghost item in the
burger menu before Settings (opens the hub's Other tab, label re-reads per
open); GHOST-11 draws the `ayu_ghost` pictogram (ported verbatim as an inline
SVG) beside the chat topbar's title, live via the new
`exterayond_ghost_mode_changed` broadcast. The hub's Ghost section gained the
four rows after "Read on Interact" (Android's row order and strings). The
drawer item's Android long-press toggle has no menu analog (recorded); the
icon font pipeline needs icomoon.io (offline), hence the inline SVG. Runbook
7.4–7.6 appended. Checklist count **87/296**.

**Priority override — polish (user instruction, 2026-11-13).** The user
reported many bugs and directed that the work move from new features to
polishing what is built. **Packet 088** ran the first polish tranche (16
fixes; see progress.md). **Packet 089** closed the three recorded items
(cross-tab sync, the DoubleTap remap tables, the push coalescing). **Packet
090 (2026-11-17)** continued with six more verified sweeps run through
parallel subagents — theming, composer, message rendering, hub tabs,
media/player, manager/store, plus a full `.extera` mapping diff against the
pinned Android EtgBackup (clean both ways) and an RTL/a11y sweep (zero
P1/P2) — with ~45 more fixes: the inverted media-viewer menu verify, the
accent preview wiping the palette, invertMedia draft restore/leak, three
popup send menus ignoring silent-by-default, the reactions-hide killing the
message time, the bubbleRadius corners half-wired, the Plugins tab blind to
install/uninstall, mention reads stuck in the unread band, `appEvent` never
dispatching START, the `.extera` decrypt vs re-saved files, and the a11y
names for the ghost indicator/lock buttons. Full unit suite green (6291),
build clean. Recorded-not-fixed: safe-mode trip announcement (needs new
copy), the ≤60 s relative-last-seen lag, the ShowSmallGIF/stickerSize
apply-on-render consistency.

**Packet 089 (2026-11-17) closed those three recorded items.** The settings
store syncs across tabs through the native `storage` event — it re-reads the
record with the boot's validation, applies only the keys that actually moved
through `setExterayondSetting` (the same live/push announcement contract as a
local write) and mirrors a remote reset with the reset's own announcements;
a record equal to the memory announces nothing, which is the echo guard.
The `.extera` backup carries `doubleTapAction` / `doubleTapActionOutOwner`
through the EtgBackup remap tables ported verbatim (EtgBackup.java:421-426):
only the common actions transfer, a web-only value exports nothing, an
untransferable exteraGram value imports as reported-unsupported. The ghost
master toggle's worker pushes coalesce into one synchronous flush carrying
the final state — synchronous so the push stays ahead of the toggle's own
status request (GHOST-04's rewrite reads the flags worker-side); a microtask
queue was considered and rejected for exactly that ordering reason. Four
affected suites green (148), tsc/lint/scss-types clean, no new modules.
Runbook batch 8 appended (8.1 the cross-tab walk, 8.2 the remap round-trip);
both await the user's acceptance.

Remaining player candidates: PLAYER-07 (cover extend — visual), PLAYER-13
(block order — would reuse the FOLD-10/12 editor pattern over the web
popup's progress/transport blocks, whose actions block does not exist).
Plugins are deferred until the user explicitly asks to resume them.
Phone-only hardware features are not desktop tasks.

## Operating constraints

- Project text is English; speak to the user in Russian. Product name: exterayond.
- Preserve existing work and do not inspect the user's authenticated session,
  private data, or personal screenshots. Authenticated checks belong to the user.
- Do not start a new server for every task: reuse an existing one when necessary,
  and avoid launching a browser/server pair for routine checks. The user reported
  out-of-memory failures. Run heavy checks sequentially with bounded workers.
- Target desktop; do not run mobile viewport checks. Keep tests focused and do
  not repeat passing checks without a relevant change or failure.
- Use free OpenCode DeepSeek for routine delegation, then free GLM if available;
  do not use MiMo or paid providers without explicit authorization. If free
  providers are unavailable, continue locally.
- The Android reference is pinned to exteraless revision `8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63`.
  `.research/android` is a local, read-only checkout and is not published. If it
  is absent, consult the pinned upstream files before inferring their behavior.
- Do not commit or push merely because work is complete. The user must explicitly
  request publication or a commit in that session.

## Before ending a work session

Update the checklist only for fully integrated entries, preserving IDs and source
links. Record changes, tests, and material unverified behavior in `progress.md`.
Replace this file's priority and current-state paragraphs when they change; keep
the next action concrete and do not present unverified work as finished.

**Packet 091 (2026-11-18) chased the invisible chat topbar**; **packet 092
(2026-11-19) retired the style to class 3** — neither the chat-width slot,
nor the plain-surface flat pass, nor the measured-inset full width produced
an honest surface (the sidebar's visual width exceeds the column's reserved
left space in the collapsed-with-open-tab and attached states, so every
full-width variant parked its content beneath the panel while the DOM probed
correct). The flat look is withdrawn: `oe-new-chat-header` is gone from the
scss, the store, the Appearance tab and the search index; the `.extera` alias
stays recognized-unsupported; the MD3 master's denominator derives from
`getMd3StyleTotal()`. The user gets the stock floating card, which always
rendered correctly.

**Same-day housekeeping** — fixed the `readUnreaded` unhandled rejection
(guarded on the filtered history's length) and quieted the dev console: logs
are errors-only unless `?debug=1` opts in, the capture buffer still records
the full timeline.

**Packet 096 (2026-11-20) worked the glass group of the Appearance tab.**
LOOK-15 is wired: `OEAppearanceGlassOutlineStyle` (int 0..2, default 0) —
GLARE keeps the stock frosted menus, SOLID swaps the drop shadow for a 1px
divider-color ring, HIDDEN removes both; the styles cover exactly
GlassMenuHelper's web surfaces (the message context menu both forms plus the
reactions bar) and yield while glass menus are off. LOOK-14 audited complete
and closed (key, off class, hub row, backup alias, search entry, defaults
test all present). LOOK-16 recorded class 3 — the row toggles LiteMode's
FLAG_CHAT_BLUR, and the web has no blur-behind pipeline to re-enable. The
`.extera` alias `glassOutlineStyle` moved to the supported table (integer
0..2). Checklist count **89/296**. Runbook 8.3 appended; the outline states
await the user's visual acceptance.

**Packet 097 (2026-11-20, no code)** audited the "completeness to be
verified" marks: LOOK-07 (SquareFab) and MEDIA-01 (AlwaysSendInHD) are
complete end to end and closed — key, default, hub row, backup alias and a
real consumer verified against the Android source. LOOK-17 recorded class 3:
the avatar-blur flag gates the profile gallery's blurred backdrop, which the
web profile does not render at all. Checklist count **91/296**.

**Beta 1 launch (2026-11-29, packet 098).** The user directed the beta 1
release: no git tags, no version scheme, hosting on Cloudflare. Done: the
one red CI test fixed (the Appearance slider list missed LOOK-15's
GlassOutline row), the changelog sync's empty state committed (tweb's
upstream entries were stale build leftovers), exteraGram pinned in
`.research/exteraGram` at `b4d852f4` as the `.extera` contract reference
(Sources updated; read-only, no copying), typecheck + production build +
bundle checks green — `dist/` is the beta 1 artifact. The deploy itself
belongs to the user's Cloudflare account (CF Pages Git integration or
`wrangler pages deploy dist`); the routes and settings are recorded in
progress.md packet 098. Next concrete action: the user connects hosting;
afterwards verify the deployed app boots and note the live URL here.
