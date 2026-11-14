# AmarDesh 🇧🇩 · 2.0

An independent bilingual Bangladesh tourist guide, built with React, TypeScript, Vite and Capacitor. Android application ID: `bd.amardesh.explorer`. No account, API key, paid backend, analytics or mandatory network connection.

[Live web app](https://sadman-dev-a11y.github.io/AmarDesh/) · [Download Android builds](https://github.com/sadman-dev-a11y/AmarDesh/releases) · [Build status](https://github.com/sadman-dev-a11y/AmarDesh/actions)

## What changed

The map has been removed, including MapLibre and the geographic boundary files. Discovery now starts with a horizontal, swipeable photographic division carousel. Select a division, choose a district, then open Attractions, Local food, History & culture, or Travel guide. The official eight division relationships and all 64 districts remain available, with bilingual district search and historic spelling aliases.

Five main destinations—Home, Explore, Food, My Trips and More—organize the application. The responsive interface includes cinematic photography, illustrated fallbacks, large touch controls, keyboard focus, a skip link, reduced-motion support and light/dark/device themes. Bangla and English are available throughout the interface and guide content; source titles and original articles retain their original language.

- Home: popular places, less familiar destinations, heritage, regional foods, suggested itineraries and local recommendations based on selected interests.
- Explore: global search across divisions, districts, attractions and dishes, with combined division/type filters and direct detail navigation.
- Destination guides: overview, experiences, getting there, planning advice, source links, review dates, save action, nearby places in the district and trip integration.
- Food guides: 13 documented regional food stories with Bangla/English names, ingredients, flavor, cultural context, serving traditions, dietary considerations and article references. Regional associations are not exclusive origin claims. No invented restaurants, prices or ratings.
- My Trips: multiple named plans, start dates, 1–30 days, attraction stops, day assignments, reorder/remove controls, stop notes, general notes, user-entered budget, shareable summaries, and delete/undo. Saved places and dishes appear here.
- Travel essentials: entry/visa links, money, transport, weather, etiquette, connectivity, accessibility, emergency services, responsible tourism and basic phrases. Official services remain external links.
- Passport: all 64 districts, visit dates and memories. Division quizzes record correct discoveries.
- Backup: export or copy JSON and restore validated v1/v2 backups. Invalid data is rejected. Source inventory can also be downloaded.

## Content and research

`src/data/districts.json` contains the 64-district register. `src/data/tourism.json` contains **103 attractions, 13 dishes, eight division cards and 109 source records**. Each guide references source IDs with publisher, URL, review date and a publication date where established. Original summaries are paraphrased, not article reproductions. The in-app Sources page exposes the full inventory.

District foundations were reviewed on 12 November 2026; the additional tourism/food research and travel essentials on 14 November 2026. Sources prioritize the Bangladesh National Portal, Bangladesh Tourism Board, Banglapedia/Asiatic Society, Department of Archaeology, district portals, UNESCO and BSS. Food research additionally uses The Business Standard, The Daily Star, University of California Press/Gastronomica and a Bangladesh Agricultural University fisheries paper.

Coverage is intentionally uneven: all districts have basic bilingual context, references and at least one attraction; 13 featured destinations have expanded descriptions. Many other attraction records remain concise reference-based introductions. Cultural entries are included where documented. Food specialties are assigned only to documented regions, so some district food pages offer the national guide instead of a speculative local dish. This edition is not a comprehensive tourism encyclopedia.

Travel conditions, permits, visas, prices and opening times can change. The app does not invent coordinates, fares, schedules, access guarantees, restaurant rankings or site-specific best seasons. It provides official reference links and clearly states where confirmation is needed. Suggested itineraries are sequences, not calculated routes or transport timetables. Physical accessibility must be checked with the destination.

### Media rights

Fifteen bundled photographs have individual authors, source URLs, original licenses and adaptation notes in `public/photos/credits.json` and the in-app credits. Wikimedia Commons and WordPress Photo Directory images are resized/compressed and may be cropped by CSS. CC BY-SA adaptations retain their original licenses. Missing destination/food images use clearly marked original illustrated covers, not unrelated stock photography. The rasmalai photograph illustrates the dish; it does not document a particular Cumilla producer. Noto Sans Bengali is bundled under the SIL Open Font License. Application source is MIT; third-party media/font licenses remain separate.

## Offline behavior and existing progress

Android packages the guide data, fonts and photos. The website pre-caches the complete production build after a successful first online load; external articles and live official services need internet. Service-worker content hashes replace stale app caches on updates without clearing user storage.

Progress is stored locally under `amardesh-v2`. On first launch, v1 favorites become saved primary attractions; passport dates/notes, quiz progress and the existing trip/budget are migrated. The old storage key is retained. Language, theme, selection, interests, bookmarks and multiple plans persist across restarts. No personal data is uploaded. Storage errors show a backup prompt. Clearing app/browser data or uninstalling removes device data: export a backup first.

## Build and verification

Use Node 22+, Java 21, Android SDK/build-tools 36. Android minimum is API 24 (Android 7.0).

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

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

The workflow `.github/workflows/build.yml` runs type checks, ESLint and tests; builds the web app; synchronizes Capacitor; builds Android; verifies the APK signature with `apksigner` and prints its application metadata; uploads APK/web artifacts; publishes a versioned debug prerelease from `main`; and deploys the web build through `gh-pages`. `main` remains default and the original `CineDesk` branch is preserved.

Automated checks cover all district relationships, bilingual search across every record, valid source/media references, map removal, recommendation relevance, v1 migration, multiple-trip backups and sanitization, division quiz uniqueness, all four district sections, bookmark/planning flows, language/theme persistence, passport and invalid restores. Service-worker tests exercise installation, cache matching, navigation fallback, failed offline requests and cache cleanup. Browser QA covers desktop and a 390px phone viewport, including Bangla dark mode, destination actions and food details. These are not physical-device or screen-reader certification tests.

The production web build measured approximately **3.6 MiB** locally, including all photos/fonts and a **129 kB gzip JavaScript bundle**. It contains no tile/WebGL engine, polling or continuous animation. Images are resized and lazy-loaded except primary hero images. Browsing and recommendations run on the device. No claim is made about measured battery use, field performance on every handset, or live transport availability.

## Production signing

Published builds are **debug signed for installation/testing**. GitHub runners generate ephemeral debug keys: differently signed previous installations may need removal before updating. Export your progress first.

Create and securely retain a production keystore outside Git. Supply these variables through a secure build environment (never committed or printed):

- `AMARDESH_KEYSTORE_PATH`
- `AMARDESH_KEYSTORE_PASSWORD`
- `AMARDESH_KEY_ALIAS`
- `AMARDESH_KEY_PASSWORD`

With those variables available, `./gradlew assembleRelease` uses the optional signing configuration. Without them, release output remains unsigned. Back up the production keystore securely and keep the same signing identity for updates. Increment `versionCode`/`versionName` for each distributed update; this edition uses `20000` / `2.0.0`.

## Maintaining the guide

Edit reviewed JSON directly; do not overwrite it with unreviewed scraping. Check district relationships and regional food claims against primary/local sources. Add source IDs and genuine review dates with every content change. New photo records require a reusable license, author, source and adaptation note. Never put credentials or private signing material in the repository. Run the checks after edits.
