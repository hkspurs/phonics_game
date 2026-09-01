---
surface: game
density: moderate
hierarchy: character continuity and reward handoff
brand: cute fantasy adventure
notes: Video review with source-backed purchase-flow evidence; no implementation.
timestamp: 2026-08-31T07-31-43Z
slug: src-scenes-shopscene-ts
---
# Critique: Dream Wardrobe purchase-to-adventure reward flow

- Date: 2026-08-31 (Asia/Hong_Kong)
- Target: supplied recording /tmp/Recording 2026-08-31 145917.mp4 plus the ShopScene, RunnerScene, PlayerAvatarService, and SoundManager paths that drive the flow.
- Method: dual-agent (Assessment A: Hypatia/Mira; Assessment B: Hume/Rex) + PM roundtable (Aristotle/Luma).
- Scope: review only. No application code, assets, purchase logic, currency logic, or inventory logic were modified.

## Evidence boundary

The recording is H.264, 1662x920, 30fps, about 10.2 seconds. It starts after the outfit is already worn: RunnerScene shows a green Dino Onesie-like full-body character, coin/gem collection, a chest reward, then a transition to a math QuestionScene. It does not show the shop purchase button, confirmation modal, or the exact purchase action; purchase-flow findings are source-backed and must be validated in a live path.

Observed sequence:

- Early Runner frames show HUD values around 288 coins / 28 gems.
- Mid-run values reach about 290 / 29.
- The chest sequence ends around 295 / 30, with a dense reward burst and a mixed +5 coin / +1 gem banner.
- Within roughly a second-plus the scene is already the math question; the question avatar is very small.
- The character reads against the sky, but its green lower silhouette loses some separation against the darker ground.

Source-backed facts:

- Shop purchase auto-equips around ShopScene.ts:2057, while the success modal copy says “已加入” and offers “立即穿上”; the action only closes the modal around ShopScene.ts:2148-2158.
- Runner jump currently falls back through outfit run/idle around PlayerAvatarService.ts:142-160.
- Runner uses a fixed 1280x720 world and full outfit scale around 0.62.
- Runner transition uses a fixed 1.6-second delay around RunnerScene.ts:2218-2220.
- Normal pickup feedback exists around RunnerScene.ts:1892; the chest reward presentation is around RunnerScene.ts:2157-2192.
- Gems reuse a victory cue and landing has no dedicated cue around RunnerScene.ts:1643 and RunnerScene.ts:1901.

Detector/browser evidence: detector returned []; a bounded Chromium pass completed with no page errors. The audio was not independently auditioned during this review, so audio conclusions remain validation gates.

## Round 1 — five proposals per specialist

### Mira / Hypatia — child UX and purchase journey

M1. Make purchase-to-equip confirmation truthful.
M2. Separate try-on, selected, owned, and equipped states.
M3. Make outfit persistence visible across Shop, Runner, Question, and reload.
M4. Distinguish normal collectible gains from chest bonuses.
M5. Give the child control of the Runner-to-question handoff.

### Rex / Hume — motion, feedback, and detector/browser

R1. Add outfit-specific jump sprites.
R2. Prioritize jump/landing over pickup, and pickup over chest FX; cap simultaneous loot during major events.
R3. Add a readable reward hold before transition.
R4. Give landing, gem, and chest events distinct audio/particle signatures.
R5. Stabilize HUD layout and add a reduced-motion path.

### Luma / Aristotle — art direction and responsive presentation

L1. Increase Runner character presence modestly.
L2. Make Dino Onesie motion poses feel authored rather than reused.
L3. Improve green-character separation from green environment.
L4. Anchor reward feedback to the chest.
L5. Validate aspect-ratio layout buckets on phone/tablet landscape instead of relying on FIT alone.

## Round 2 — adversarial challenge

The agents were asked to challenge the other two proposals rather than agree.

- M1: KEEP. The copy/action mismatch is directly confirmed by source, even though the video does not show the shop.
- M2: MERGE into M1. Labels alone could add clutter; fix the state contract first.
- M3: NEEDS EVIDENCE. Persistence appears wired and the video shows no reversion; test reload and missing-asset cases before adding a banner.
- M4 + L4: MERGE. One reward treatment is enough; two cards would compete.
- M5 + R3: MERGE. One reward handoff experiment, not two timers or controls; the current 1.6s delay is real but comprehension failure is not proven.
- R1 + L2: MERGE. This is one outfit-motion art pipeline gap, not two asset workstreams.
- R2: NEEDS EVIDENCE. The clip is busy but does not prove stutter or blocked input; profile a low-end device before adding a cap system.
- R4: NEEDS EVIDENCE before implementation. Source suggests a cue gap, but the recording was not independently auditioned and extra stimulation may hurt recognition.
- R5: DROP speculative caching/HUD redesign; RETAIN reduced-motion as a separate accessibility requirement.
- L1: NEEDS EVIDENCE. Scale 0.70-0.74 may improve presence but may overlap collectibles or controls.
- L3: DROP for now or test contrast first. A halo could recreate the pasted/sticker look.
- L5: NEEDS EVIDENCE. No phone or iPad capture was supplied; FIT alone is not proof of a defect.

Self-challenges were also made: the proposed new art has cost risk, the reward timer needs a sound-off comprehension test, and audio claims need a real mix/device pass.

## Round 3 — revised proposals

### Mira / Hypatia

1. P0 KEEP: truthful purchase/equip state, merging M1 + M2.
2. P1 MERGE: one pickup/chest reward treatment, merging M4 + L4.
3. P1 MERGE: one reward handoff test/rule, merging M5 + R3.
4. P2 DEFER implementation: validate persistence/reload/fallback, then add only a short visible outfit confirmation if needed.
5. P2 MERGE: one Dino motion-art brief, merging R1 + L2.

### Rex / Hume

1. P0 KEEP: truthful purchase-to-equip feedback.
2. P1 MERGE: one Dino outfit-motion acceptance slice.
3. P1 MERGE: one calm reward handoff experiment.
4. P2 DEFER implementation: run an audio/FX recognition gate before adding cues.
5. P1 KEEP narrowly: ship reduced-motion; defer speculative caching/HUD redesign.

### Luma / Aristotle

1. P0 KEEP: truthful purchase confirmation.
2. P0 MERGE: one chest-anchored reward and handoff treatment.
3. P1 MERGE: one pose-specific Dino asset brief.
4. P1 NARROW: responsive clearance gate before changing scale, halo, or layout.
5. P2 DEFER: validate event audio recognition before adding cues.

## PM synthesis — the ten changes worth putting into the next task batch

These are ten actionable work items, ordered by child trust and evidence. They deliberately preserve the current Wardrobe layout and do not touch Currency, Inventory, or Purchase rules beyond truthful feedback.

1. **P0 — Make purchase success state truthful.** Align auto-equip behavior, modal copy, CTA, card status, preview, and saved equipped item; remove the inactive “立即穿上” illusion. Acceptance: one purchase charges once and all visible states agree after reopening the item.
2. **P0 — Make try-on / owned / equipped states unambiguous.** Keep the existing gold selection treatment, but use explicit text/badge semantics and reserve the checkmark for currently worn state. Acceptance: a child can identify each state without relying on color alone.
3. **P0 — Use one reward language system.** Keep short +1 pickup feedback, then show one chest-anchored two-line summary such as “寶箱獎勵 +5 金幣 / +1 寶石”; do not stack M4 and L4 cards. Acceptance: final HUD delta reconciles with the two semantic phases.
4. **P1 — Test and tune one reward-to-question handoff.** Hold the calm reward long enough to read and offer an optional 下一題 tap; retain auto-advance unless testing shows it fails. Acceptance: 4/5 children identify the reward with sound off and reach the next question without confusion.
5. **P1 — Produce one authored Dino Onesie motion set.** Request idle, run, jump, and cheer wearing frames with common feet baseline, hood/hand anchors, and no base-sprite flash. Do not substitute thumbnail art. Acceptance: visible pose differences and baseline within about 2 virtual pixels.
6. **P1 — Verify outfit persistence and fallback end to end.** Test Shop → Runner → Question → reload and missing-art fallback; only add a short “已穿上” confirmation if the path passes. Acceptance: no silent outfit reversion and one stable outfit ID through the path.
7. **P1 — Run responsive character-clearance captures before scaling.** Measure 1280x720, 1662x920, 20:9 mobile landscape, and iPad landscape; then tune avatar scale, feet/shadow anchor, and background separation only where evidence supports it. Acceptance: no clipping/overlap and character remains the visual focus.
8. **P1 — Add reduced-motion behavior.** Disable looping tweens and non-essential particles while retaining currency and reward text. Acceptance: the same reward values and scene transition remain understandable with reduced motion.
9. **P2 — Run an audio/FX recognition gate.** Listen and profile coin, gem, landing, and chest events on target devices before commissioning new cues; keep one intentional sound and bounded burst per event. Acceptance: no duplicate victory cue and at least 4/5 children distinguish the key events by sound when appropriate.
10. **P2 — Measure reward FX density/performance before adding a cap system.** Profile low-end mobile and check whether simultaneous loot blocks the player or causes frame drops; only then enforce motion priority jump > pickup > chest. Acceptance: no input obstruction and stable target frame rate during the chest event.

## Explicitly not recommended now

- Do not add a halo just to make the green character pop; it may worsen the pasted-on look.
- Do not jump directly to scale 0.70-0.74 without device/clearance evidence.
- Do not build a broad responsive architecture or speculative texture-cache/HUD rewrite for this review.
- Do not create separate R1 and L2 pipelines; they are one asset brief.
- Do not add new audio purely from source inspection; audition and test first.

## Design Health Score (heuristic, 1–4; not a user-study metric)

| Heuristic | Score | Review finding |
|---|---:|---|
| Visibility of system status | 2 | Currency changes, but reward semantics and purchase/equip state are not consistently explicit. |
| Match to real-world/child mental model | 3 | Chest, coins, gems, and outfit fantasy read well; “added” versus “worn” conflicts. |
| User control and freedom | 2 | Fixed handoff and unclear equip action reduce control. |
| Consistency and standards | 2 | Modal copy, CTA, badges, and reward layers do not express one state model. |
| Error prevention | 2 | Misleading purchase feedback can cause a child to repeat or distrust the action. |
| Recognition over recall | 3 | Main controls and counters are visible; ownership/equipment still needs labels. |
| Flexibility and efficiency | 2 | No tested low-stimulation path or optional transition control. |
| Aesthetic/minimal design | 3 | Cute fantasy palette and character are promising; chest burst is visually dense. |
| Error recovery | 2 | Fallback exists, but silent fallback/reversion is not explained. |
| Help/documentation | 1 | No child-friendly explanation confirms what was bought, worn, or earned. |

**Total: 22/40.** The main opportunity is feedback truth and character continuity, not a wholesale store redesign.

## Design specificity verdict

The game has an authored, child-friendly fantasy identity: chibi outfit, bright sky, chest, coins, gems, and playful adventure framing. The presentation becomes generic at the reward/scene handoff because several effects compete without a single authored message. The strongest next move is a calm, game-specific reward grammar plus a truly authored wearing animation set—not more decoration.

## Priority audit

### P0 — fix now

- Purchase/equip truthfulness.
- Explicit state semantics.
- One reward summary and readable handoff.

### P1 — validate and ship next

- Dino pose art.
- End-to-end persistence/fallback.
- Responsive character prominence/clearance.
- Reduced-motion path.

### P2 — measure before implementing

- Audio recognition.
- FX density/performance cap.

## Targeted PM decisions

1. Recommended purchase rule: auto-equip after purchase, but change the success state to “已購買並穿上” and show a real “繼續” action. Alternative: purchase-only with a functioning equip CTA.
2. Recommended handoff rule: retain a short auto-advance with an optional 下一題 tap; make it fully manual only if the child test fails.
3. Provide the target 20:9 phone and iPad landscape captures, plus the authored Dino pose assets, before approving scale/art changes.

## Run Notes

- Input artifact: supplied recording, inspected through extracted review frames/contact sheets; original recording left untouched.
- Source review: ShopScene, RunnerScene, PlayerAvatarService, SoundManager, and Scale.FIT setup.
- Detector: returned [] for the reviewed UI target.
- Browser: bounded Chromium pass completed with no page errors; server stopped.
- Delegation: Hypatia/Mira, Hume/Rex, Aristotle/Luma; three rounds completed, no files edited by agents.
- Worktree: application source unchanged; only the pre-existing/untracked critique artifact area remains outside application code.
- Cleanup: extracted temporary review frames are disposable and should be removed after snapshot persistence.
