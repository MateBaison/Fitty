# Combat audio

Starting combat unlocks and primes Web Audio in the user's gesture, with the prefixed Safari constructor as a fallback. Supported browsers request the playback audio-session category. Both suspended and Safari-interrupted contexts resume; closed contexts can be recreated. Active clocks retry on visible-page return, pageshow and a fresh pointer gesture. Playback failures produce one localized notice per start attempt instead of being silently discarded. No duplicate timer or delayed duplicate phase signals are introduced.

Round start: three synthesized metallic bell strikes. Round end before rest: two strikes. Fifteen seconds remaining in work phases longer than 15 seconds: three short wooden-style clacks. Session completion: three bell strikes followed by a descending three-note finish cue. Pause/resume does not repeat a round-start bell. Workout-rest start/end beeps retain their existing patterns.

Unit coverage simulates Safari's interrupted/prefixed context and output priming. Browser coverage checks both rounds, warnings, rest, finish, pause/resume, actual AudioContext suspension/recovery and no duplicate finish signals in mobile/desktop Chromium. These checks verify audio scheduling and browser recovery; hardware speaker volume, operating-system restrictions and physical Safari devices still need device verification.
