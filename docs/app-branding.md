# FITTY launch branding

The supplied isotipo is used for the browser/home-screen icons and the launch screen only. Interior navigation and FITTY wordmark remain unchanged.

`src/app/manifest.ts` advertises FITTY in standalone mode with 192/512 PNG icons, a padded maskable icon and `/home` as the launch URL. The shortcut icons combine the isotipo above the supplied Fitty wordmark with safe outer margins; Apple touch metadata uses the same composition at 180px. The new `fitty-lockup-*` filenames avoid reusing cached isotype-only assets. The original archived `public/hercules.webmanifest` remains preserved and is no longer linked by the app.

The root launch overlay displays for 1.5 seconds on a full page/app launch, including a final 250ms fade. Root-layout persistence prevents replay during internal navigation. CSS also hides it if JavaScript cannot start; reduced-motion preferences disable the fade. It does not postpone auth, data loading or normal app interaction.

The launch artwork pairs the isotipo with the supplied transparent “Fitty” image below it (`public/assets/brand/fitty-launch-wordmark.png`), retaining its white, blue and yellow colors. Transparent outer margins were trimmed for sizing; the artwork is not redrawn. The complete vertical group is centered horizontally and vertically on mobile and desktop.

Icons derive from `/Users/mb/Desktop/Material FItty/Isotipo con fondo.png` without redrawing the artwork. The opaque square store master is kept outside the repository in `~/Desktop/Fitty-diseño/brand/fitty-store-icon-1024.png`; the Expo app uses copies in `apps/mobile/assets/images/` (`icon.png` from the store master, `splash-icon.png` and the Android foreground from `fitty-lockup-icon-1024.png`). Existing shortcuts may cache their previous icon and need to be recreated.
