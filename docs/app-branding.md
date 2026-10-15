# FITTY launch branding

The supplied isotipo is used for the browser/home-screen icons and the launch screen only. Interior navigation and FITTY wordmark remain unchanged.

`src/app/manifest.ts` advertises FITTY in standalone mode with 192/512 PNG icons, a padded maskable icon and `/home` as the launch URL. Apple touch metadata uses a 180px icon. The original archived `public/hercules.webmanifest` remains preserved and is no longer linked by the app.

The root launch overlay displays for 1.5 seconds on a full page/app launch, including a final 250ms fade. Root-layout persistence prevents replay during internal navigation. CSS also hides it if JavaScript cannot start; reduced-motion preferences disable the fade. It does not postpone auth, data loading or normal app interaction.

The launch artwork pairs the isotipo with the supplied transparent “Fitty” image below it (`public/assets/brand/fitty-launch-wordmark.png`), retaining its white, blue and yellow colors. Transparent outer margins were trimmed for sizing; the artwork is not redrawn. The complete vertical group is centered horizontally and vertically on mobile and desktop.

Icons derive from `/Users/mb/Desktop/Material FItty/Isotipo con fondo.png` without redrawing the artwork. `output/brand/fitty-store-icon-1024.png` is the opaque square store master. A future native iOS/Android project must use this file for its app-icon/launch resources; no native package or store listing is published by this web change. Existing shortcuts may cache their previous icon and need to be recreated.
