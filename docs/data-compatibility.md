# Data compatibility contract

The existing Supabase table remains `public.mrgymson_state` with `user_id`, `payload` and `updated_at`. No hosted schema, policy or records were changed by this implementation. The archived SQL is a reference, not a fresh audit of actual RLS. The repository validates returned rows with Zod; no fabricated live-generated database type is claimed.

Snapshots retain routines, selected routine, sessions, active workout, profile, settings, favorites and custom exercises, plus unknown fields at every persisted object level. Old aggregate sessions need not contain individual sets. Retired exercise history is not deleted. Null blanks, nullable historical durations, string profile weights/heights, photos, notes, original done/entered flags and unknown metadata survive reads/round trips.

Saved data uses tolerant Zod readers; new commands use bounded/strict input schemas. Missing fields can receive compatible defaults; malformed data returns an explicit error instead of silently becoming an empty account. Seconds and repetitions remain distinct. New logged sets save input without a tick; untouched default values are not invented as completed sets.

## Persistence and recovery

- Verified account UUID owns its provider, local cache and repository.
- Account keys remain `mrgymson-user-<UUID>`; the legacy guest key is preserved, never automatically uploaded into another account.
- Initial cloud read/reconciliation happens before writes; initial defaults are not automatically uploaded.
- Local input persistence is immediate. Cloud uploads debounce 900ms, run serially and capture edits made during an in-flight upload.
- Failed cloud reads allow local cached editing but block cloud uploads until recovery. Disposed account work cancels requests/timers.
- Original raw cache backups use `<key>:migration-backup-v1:<timestamp>`. Divergent copies require an explicit choice and preserve fingerprinted local/cloud conflict backups. A failed backup blocks replacement.
- Profile, workout completion and sign-out can flush explicitly. Upload errors remain visible; a pending local save must not be called a successful cloud save.
- Full photo-heavy payloads go directly browser → Supabase under the user's session/RLS. Server summary reads select only small profile fields. No service-role key is used.
- Browser saves now use conditional updates against the loaded `updated_at` revision, or an insert for an absent account row. Stale updates and duplicate inserts reconcile again and require an explicit choice with backups. This uses existing RLS and columns; no hosted schema migration is required. It is not a realtime merge, and old clients still using unconditional upserts must be refreshed.
- Clean accounts check the small `updated_at` field on focus/visibility and every 30 seconds while visible, loading full snapshots only when it changes. Pending edits and uploads are not replaced by polling. A clean cache matching its saved base accepts a newer cloud copy; unrelated or pending divergent copies still require a choice.

## Origin handoff

New Vercel origins cannot access the old site's storage/cookies. Reauthentication restores cloud data only; explicit export/import handles unsynced old-origin data. Profile JSON exports include private records/photos and must not be publicly shared. Routine links and workout posters intentionally omit private profile fields, body weights, photos and exercise notes.

Historical set editing preserves untouched original fields/totals where only metadata changes. Calendar copies receive independent IDs/date and omit original photos/body weights. All optimized image assets and original baseline files are verified by SHA-256.

The original 136 exercise definitions and archived images remain unchanged. Three additions (side plank, prone Superman and prone alternating contralateral lumbar raises) are defined separately in `src/data/additional-exercises.json`, with new male/female image paths in `additional-image-variants.json`. Side plank uses seconds; both lumbar movements use repetitions. Existing quadruped Superman and prone trunk-extension IDs remain readable and available. The archived SHA-256 baseline is not regenerated for additions.

Optional `trackingSessions` store private running/cycling routes separately from strength-training sessions: id, start date, mode, durationSeconds, distanceMeters and chronological GPS points (lat/lon/time/speed). Existing accounts need no new collection until a route is saved. Finalizing an activity with at least two GPS points saves via `useApp().change`, preserving normal local/cache/cloud reconciliation. Route display uses Leaflet with a MapLibre/OpenFreeMap Positron basemap, removing symbol layers (labels and POIs); GPS recording continues if map tiles fail. Full exports include routes; routine sharing and workout posters do not. Unfinished routes are transient and are lost on reload. Saved routes are bounded to 10,000 sampled points with endpoints retained; measured distance is retained separately, not recomputed from the sampled line. Browser background GPS remains platform-dependent. Map tiles use normal HTTP caching and visible attribution; no offline tile prefetch or key is configured.

## Optional menstrual calendar

`profile.menstrualCalendar` optionally stores `enabled` and an array of local calendar dates (`YYYY-MM-DD`) with menstrual bleeding. Existing accounts need no new fields. Unknown metadata is preserved. Disabling the feature keeps recorded dates; clearing them requires profile saving. These private dates are included in full account backups but excluded from routine sharing and workout posters. Masculine profiles (`hombre`, legacy `male` or `masculino`) suppress the activation control, training-calendar menstrual borders/legend and the menstrual readiness prompt, without deleting or changing stored dates or the enabled flag. Switching back restores the saved setting. This basic calendar does not predict phases, fertility or prescribe training changes.

When the menstrual calendar is enabled, selecting a routine day offers an optional pre-workout wellbeing check (pain, energy and sleep). Answers and advice are transient and never added to account snapshots or shared outputs. Advice does not automatically alter routines, recorded loads or session data. Severe pain receives guidance to rest and seek medical advice. Clinical reference: https://www.nhs.uk/symptoms/period-pain/ . The advice uses reported symptoms, not inferred cycle phases.

Performed sets may include a `type` string (`warmup`, `normal`, `failure`, `drop`). Missing or unrecognized values display as normal; historical values remain readable. Selecting a type alone does not mark a set as entered or completed. Completed sessions and account backups retain the type; volume/count calculations remain unchanged.

In-workout exercise replacement only edits the active workout. Entered/done sets remain under their original exercise; pending sets become a new entry when needed. Saved routines and historical sessions are unchanged. Suggestions reuse the pending count and comparable quantity, or target-exercise history with weight-unit conversion. There is no inferred conversion of loads across exercises, or repetitions to seconds. Suggested values remain `entered: false` / `done: false` until the user records them. Type names/letters are localized while stored identifiers stay stable.

## Weekly training time

Personal record highlights are derived from recorded sets for the same exercise and metric before the workout/session date. They indicate a higher historical load, or more repetitions/seconds at an equivalent load (converted between kg/lb with a 0.05 kg tolerance). Ties, untouched defaults, unknown aggregate-only history and a first performance are not records. Earlier valid sets in the current exercise also become comparison points. No record flags or calculated values are written into historical snapshots.

Sessions may store an optional `rating` (`excellent`, `good`, `okay`, `bad`, `very_bad`) selected when finishing or editing a workout. Existing sessions remain unselected; historical unknown values are preserved until explicitly replaced. Ratings remain private account data and are not added to routine shares or workout posters.

Session `duration` retains its historical unit, minutes. New completed workouts record elapsed time from `workout.started` to saving, including rests and time with the app in the background. Unknown historical durations remain null/absent and are explicitly excluded from weekly time totals. Calendar copies retain their existing null-duration behavior. Week boundaries and daily grouping use local dates, Monday through Sunday.

Entering Tracking requests one current location fix to center the live map. A late fix cannot overwrite a route that has started; permission failures leave manual centering and GPS controls available. Saved route dialogs do not request the current position. This preview fix does not record an activity or upload coordinates.

## Grouped drops and exercise metric preferences

Optional `settings.exerciseMetrics` stores the user's last explicit repetitions/seconds choice per exercise ID through the normal account change/cache/sync path. New workouts freeze that choice in their entry. Without an explicit preference, the latest performed exercise provides a compatible fallback, then the catalog default. The audited 139-exercise catalog uses seconds for static front/side planks and wall sits; all dynamic movements use repetitions. Historical edits determine their own metric from recorded sets, independently of current preferences. Changing metric does not convert repetitions to seconds; values remain in the active draft and only the selected metric is saved as the new performance.

Optional set `dropGroup` links the separately recorded segments of one descending set. Each segment retains its load, quantity and type; aggregate set/group counts count each group once, while volume includes every entered segment. Untouched suggested loads are excluded. "Reduce weight" proposes 20% or 25% below the current segment and remains adjustable. Older ungrouped descending rows remain independent; historical groups are not inferred. Rest controls appear only on the last segment, and `restUsed` marks explicit timer use in the active workout, independently from recording/completion.

The calendar shows localized type letters/colors; editing preserves session duration and unrelated exercise/set metadata. Progress offers a warm-up inclusion filter for exercise histories. The personal-record panel excludes warm-ups, distinguishes exercise and metric, normalizes kg/lb, and shows the originating session. It lists best performances even when they only establish an initial baseline; existing yellow new-record highlights still require a preceding comparable performance.

## Workout and summary controls — 2026-10-12


New workout entries initialize blank sets from the latest recorded set count for that exercise (three when no history exists). Grouped drops count once; aggregate-only historical set totals are supported. Initialization is bounded at 200 sets and never copies completed values or flags. Routine-derived calendar entries follow the same count.

The repetitions/time switch retains both quantities and the shared load in the draft. Optional `metricStates` preserves entered/done flags separately for repetitions and seconds, including through account cache round trips. Returning to the prior metric restores its flags; switching does not convert one quantity into another or complete untouched defaults. Finalization still saves only the selected performance metric.

Weekly summaries normalize volume to kilograms before display conversion, and the sessions denominator uses the currently active routine's day count. The former independent weekly-goal control is superseded in the UI; its historical setting remains readable. Lifetime totals count all valid recorded sessions and distinct local training dates; unknown durations remain excluded from known time. Weekly day buttons reveal account-local records without changing them.

## GPS live pace — 2026-10-13

Active tracking displays recent speed/pace rather than the whole-route average. Transient readings prefer the device's speed in meters/second, with short smoothing and a coordinate fallback. GPS accuracy, actual sample timestamps, noise thresholds and mode-specific plausibility bounds filter new distance increments. Stale readings are hidden; gaps over 15 seconds re-anchor without adding a jump. Finalized routes keep average pace from saved distance/time. Existing routes and their totals are not recalculated, and the saved point/session format remains unchanged. Real-device GPS accuracy and background delivery still need field verification.

## Retired library choices — 2026-10-13

`abdominales-con-brazos-estirados` and `extension-de-triceps-con-cable-a-una-mano-con-agarre-supinado` are excluded from the available library, exercise pickers, replacements and new automatic routines. Their original definitions, IDs and images remain intact for saved routines, active workouts, imports and history. Progress resolves the complete catalog so older rows without a stored muscle group retain their muscle set totals. No account snapshot is rewritten or deleted by retirement.


## Retired leg choices — 2026-10-17

`sentadillas-con-propio-peso`, `sentadillas-con-balon-medicinal`, `peso-muerto-con-balon-medicinal`, `sentadilla-con-minibanda`, `puente-con-bandas`, `elevaciones-de-cadera-con-maquina-smith` and `elevaciones-cortas-en-posicion-de-rana-con-maquina-smith` are excluded from the available library, exercise pickers, replacements and new automatic routines. Original IDs, definitions and image variants remain readable for saved routines, active workouts, imports, history and progress totals. Existing account records are not rewritten or deleted. Other squat and hip exercises remain selectable.


## Current exercise classification — 2026-10-17

`elevaciones-de-cadera-acostado-lateralmente` is shown under Abdominales through a current-catalog group override. Its original ID, archived Piernas definition and images remain intact. Saved routines continue referencing the same ID; stored session groups and totals are not rewritten. Historical entries without a stored group use the current catalog classification when a fallback is required.


## Glutes library category — 2026-10-18

The current catalog classifies 13 dedicated glute movements under `Glúteos` using ID-based overrides. Archived definitions and all exercise IDs/images remain intact, including retired choices. Saved routines still resolve those IDs; recorded session groups are preserved and are not rewritten. Historical entries without a stored group use the current category as fallback. New custom exercises and automatic routines accept Glúteos, with its own available pool and lower-body split. Full body is the library's all-exercises view, not a persisted muscle group.

## Progress dashboard and body measurements — 2026-10-18

Progress uses a shared local-calendar period across Summary, Exercises and Body. Muscle totals include Glúteos and preserve historical stored groups. Comparisons normalize volume to kilograms, retain unknown durations and count linked drops as one set. New-record counts exclude warmups, ties and initial baselines. Exercise charts keep repetitions and seconds separate, with dates and individual point selection; existing records remain unchanged.

Optional `bodyMeasurements` contains ID/date, optional weight in kg, optional waist/hips/chest/arm/thigh measurements in cm and an optional compressed photo. Tolerant readers preserve additional metadata; new inputs are bounded and validated. Entries are saved through `useApp().change`, included in private full-account backups and never added to routine shares or workout posters. Historical session weights/photos remain available as body-chart/photo sources. No existing session or profile measurement is rewritten. Body photo comparisons are private account UI, not public shares.

Progress period controls accept day/week/month/quarter/year/lifetime. Default ranges align to local calendar starts (Monday, first of month, first of quarter, January 1). Manually selected dates remain the exact range start; month/year shifts clamp to the last day of shorter months. Today and changing period restore natural boundaries. Recent improvements has an independent rolling week/month/three-month window, retaining full earlier history for comparison. Swipe navigation changes only transient views/routes and does not mutate snapshots; inputs, dialogs, maps, horizontal scrollers and active workout routes are excluded.

The Compare photos section also accepts standalone dated photo uploads, without a workout or measurements. These use the same bounded `bodyMeasurements` entries and account change/sync path; no sessions are created. Existing workout photos remain selectable. Closing or reopening the upload dialog invalidates any pending image conversion so it cannot populate a later draft.

Pyramid sets use `type: "pyramid"` and the existing optional `dropGroup` identifier to link their segments, preserving the same grouped-set counting and per-segment volume as drop sets. Existing drop sets retain their identifiers and values. Both display decimal segment numbers.

## Guided first use — 2026-10-18

New accounts enter personal details, then choose manual or automatic routine setup. Personal details remain a transient draft until the final action. Finalization appends one routine and sets profile completion atomically through the existing change/flush path, preserving pre-existing routines, history and unknown profile fields. Optional private profile metadata `trainingExperience` and `trainingGoal` survives tolerant readers. A failed cloud flush stays on the retry step; refreshing a locally completed onboarding retries synchronization without creating another routine. Existing completed cloud accounts bypass onboarding. Country selection retains saved names (including legacy free-text values) without normalizing away old values.

Progress period comparisons are derived from two inclusive local date ranges; no historical sessions are changed. Unknown durations remain unknown and excluded from recorded minutes. Replacement candidates are now limited to the original primary muscle group and optionally filtered by equipment; logged sets and stored routines retain the existing replacement behavior.
