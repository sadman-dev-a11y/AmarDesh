# AmarDesh 🇧🇩

A bilingual, offline-friendly Bangladesh field guide and travel passport built with React, TypeScript, Vite, MapLibre and Capacitor. Android package: `bd.amardesh.explorer`.

## Use the app

- Explore all **8 divisions and 64 districts**, using real district polygons from BBS/OCHA via geoBoundaries.
- Tap a polygon, zoom into a division, or use the searchable district cards. A keyboard-accessible SVG fallback uses the same geometry when WebGL is unavailable.
- Switch between Bangla and English; fonts, guides, map geometry and photographs are bundled.
- Filter by division and heritage, culture, nature or coast; search current and historical English spellings, Bangla names, landmarks and the included foods.
- Save favorite districts and log visits with a date and personal memory. Passport stamps and three achievement badges track progress.
- Answer division and landmark quizzes with explanations and linked references. Correct discoveries persist.
- Plan a multi-day trip with district stops, reorder controls, per-stop days and notes, start date and your own budget. No invented fares or route-time estimates.
- Export/restore a JSON backup; no accounts, analytics, paid backend or server-side personal data storage.

## Build and validate

Node 22+ and Java 21 are required. Android 7.0+ (API 24), compile/target SDK 36.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npx cap sync android
cd android
./gradlew assembleDebug --no-daemon
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

The `Verify, build Android and publish` GitHub Actions workflow runs checks, builds the web app and APK, uploads APK/web artifacts, creates a versioned prerelease for pushes to `main`, and publishes the web output to `gh-pages`. Configure GitHub Pages to deploy from `gh-pages`, `/ (root)`. Web history uses hash routes, so no server rewrite is required. The original `CineDesk` branch is preserved; `main` is the default branch.

## Offline behavior and privacy

The Android app packages all guide data, photos, fonts and district boundaries, so it does not need a first network visit. On the website, the service worker pre-caches the complete build after the first successful online load. External references and Google Maps searches need internet. MapLibre uses bundled GeoJSON with a plain local background: **no external tile server, API key or tile downloads**.

Favorites, language, trip, notes, visits and quiz progress use device-local storage. Clearing browser/app data or uninstalling removes them. Keep a backup. The backup dialog also exposes copyable JSON for Android environments that do not support web file downloads. Import replaces device progress; malformed data is rejected and unknown district IDs are discarded. Storage failures show an export prompt.

## Data, sources and licensing

Reviewed **12 November 2026**. Each district record includes source URLs and review dates in `src/data/districts.json`; references are visible in the district guide.

- **Current district/division register:** [Bangladesh National Portal](https://bangladesh.gov.bd/views/district-list/).
- **District geometry:** BBS / OCHA ROAP, 2020, `BGD-ADM2-16705992`, distributed by [geoBoundaries](https://www.geoboundaries.org/api/current/gbOpen/BGD/ADM2/), **[CC BY 3.0 IGO](https://creativecommons.org/licenses/by/3.0/igo/)**. Boundary geometry is unchanged from the publisher’s simplified file; names/IDs were normalized and joined to current divisions. See `public/data/boundary-metadata.json`. Not a cadastral, navigation or legal boundary product. geoBoundaries source commit: `9469f09`.
- **History / culture / landmarks:** individual [Banglapedia](https://en.banglapedia.org/) district articles (Asiatic Society of Bangladesh), supplemented with Bangladesh Tourism Board, Department of Archaeology, official district portals, UNESCO and Bangladesh Sangbad Sangstha references. Facts are independently paraphrased; source articles and government photos are not redistributed.
- **Photographs:** Wikimedia Commons and WordPress Photo Directory, with individual authors, source URLs, licenses and modification notes in `public/photos/credits.json`. Images are resized/compressed and displayed with a CSS crop. CC BY image adaptations retain attribution. Other districts deliberately use category illustrations rather than unrelated photographs.
- **Fonts:** Noto Sans Bengali, SIL Open Font License, distributed by `@fontsource/noto-sans-bengali`.
- Application source: MIT. This does not relicense third-party boundaries, fonts or photographs.

### Content coverage and limits

Every district has a current division relationship, bilingual name, starter destination, description, history/basic context and references. This is a curated starter guide, **not a comprehensive 64-district tourism encyclopedia**. Specific local food coverage is currently five districts; cultural music entries cover 41. Missing specialties and cultural entries are explicitly acknowledged instead of invented. Some history entries use basic administrative context. Some obscure destinations appear through the surprise discovery feature, but no claim about current popularity or access is made. Only four destination photographs are used.

Access restrictions, conditions, transport, permits and opening times can change. Verify with the relevant official office before travel. Particularly check hill-tract permissions, forest permits, island access and water/weather conditions. The planner is a manual itinerary, not turn-by-turn routing or a booking service. No attraction coordinate points are fabricated: place search uses the verified attraction name.

### Research maintenance

The curated register is in `scripts/districts.tsv`; the app data contains the reviewed translations and reference URLs. Review edits to `src/data/districts.json` directly. `scripts/build-data.py` documents the initial transformation but is not a substitute for editorial review: regenerating without the original research notes drops cultural entries. Boundary geometry must remain paired to the 64 current IDs and matching divisions. Run tests after any data change; source review dates must reflect real re-review.

## Signing a production release

The published APK is **debug signed**, suitable for installation/testing. GitHub-hosted runners generate ephemeral debug keys, so separately built debug APKs may require uninstalling an older installation first. Export a backup before uninstalling.

For a stable production release, create and retain your own keystore outside Git. Set these environment variables in your secure build environment:

- `AMARDESH_KEYSTORE_PATH`: absolute local path to the keystore
- `AMARDESH_KEYSTORE_PASSWORD`
- `AMARDESH_KEY_ALIAS`
- `AMARDESH_KEY_PASSWORD`

With those variables available, `./gradlew assembleRelease` signs the release build. Store the keystore and passwords in an approved secret store and securely recoverable backups. Never commit them, print them to logs, or reuse the debug key for distribution. Without the variables, release output remains unsigned. Increase `versionCode` and `versionName` before shipping updates.

## Verification scope

Automated tests cover the official division counts, every district-to-polygon join, closed geometry rings and geographic ranges, bilingual fields and sources, all district/landmark searches, filters, backup sanitization, quiz uniqueness and major user workflows. Browser QA covers layout and interactions; MapLibre is mocked only in component unit tests, with geometry tested separately. A successful APK build verifies compilation and packaging, not physical-device installation or all GPU/WebView combinations. Hardware testing remains recommended.
