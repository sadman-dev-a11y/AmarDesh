# AmarDesh 3.0.0

- Optimized non-debug Android release configuration, native app/back handling, status bar, splash, sharing, Preferences, Filesystem, haptics and opt-in location.
- Verified migration retains v1/v2 keys. Serialized durable writes prevent stale saves. Restore accepts a file, previews counts and requires explicit replacement.
- Versioned offline JSON content with schema and CI validation; separate Trips, Quiz, Backup, Near Me and map chunks.
- 39 revised historical notes, 18 district-specific cultural entries and 23 documented food entries. Removed misleading route boilerplate; unknown access details stay explicit.
- Alternative-spelling and typo-tolerant search; 13 editable suggested sequences.
- Local 64-district passport map with attribution, completion badges, four quiz formats, daily question and practice streak.
- Larger type, Bangla number/date helpers, reduced motion, focus states and 48px minimum controls. Bengali woff2 fonts and two-size WebP photos.
- Trip checklist, coordinate-based straight-line calculation when all stops are covered, optional Near Me and Maps links. Unknown coordinates use a clearly labelled name search.

## Remaining verification and coverage gaps

This release does not claim that every item in the original improvement prompt is complete.

- Verified coordinates currently cover three attractions. Other attractions use Maps name search. District HQ coordinates remain unverified; map polygons are not HQ coordinates.
- 15 original licensed photographs were optimized; additional unique photography has not been sourced for every attraction.
- Some district histories, culture, foods, routes, seasons, fees and accessibility details remain unverified. The app reports gaps rather than inventing them.
- Visit photos and shareable passport images are not implemented. Visit notes are preserved.
- The correction action opens GitHub's issue form, which requires a GitHub account to submit; anonymous correction hosting is not configured.
- No low-end physical Android timing, TalkBack, GPS hardware, Android Auto Backup or share-target testing has been performed here. Browser tests do not replace device tests.
- Data JSON is fetched separately at startup for cross-screen search; itinerary and boundary data are lazy-loaded. Not every content category is lazy-loaded per screen.
- The native onboarding is three steps. Existing debug installs may require backup, uninstall and restore because the release certificate differs.
