# stationqc

The StationQC website: a scroll story from orbit down into Montréal and into the app, the province's prices falling into the shape of Québec, support and legal pages, and a TestFlight beta sign-up.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Home page (the Earth scene is inlined so the page also works opened from disk) |
| `support.html`, `privacy.html`, `terms.html` | Support and legal pages |
| `assets/css/site.css` | All styles, including the liquid glass material |
| `assets/js/copy.js` | Every piece of text, English and French, one key per line, including the legal pages |
| `assets/js/core.js` | Language, glass tab bar, smooth scrolling, footer |
| `assets/js/home.js` | Loader, the scroll story, the Québec pins, FAQ and beta form |
| `assets/js/doc.js` | Support and legal pages |
| `assets/img/shots/` | Real app screenshots, English and French |

Old links such as `index.html#/privacy` redirect to the new pages.

## Beta sign-ups

- Sign-ups are handled by Formspree, so the site stays fully static on GitHub Pages. There is no server code in this repo.
- The form endpoint is configured in the `action` attribute of the beta form in `index.html`.
- Opened from disk (`file://`), the form says it works once the site is online.
- To invite someone: App Store Connect → TestFlight → External Testing → add their email.

## Before launch

- Set the real App Store link in `APP_STORE_URL` at the top of `assets/js/core.js`.
- The Earth model and textures load from a third-party bucket (`api.getlayers.ai`). Copy `planet.glb` and `planet-lights.glb` to your own hosting and update `BASE` in the globe script in `index.html`.
- The privacy policy and terms were updated on November 13, 2026 for StationQC 3.4: Scout Mode and background location, station weather from Apple Weather, and Formspree as the beta form processor. Have them reviewed if you need legal certainty.

## Keeping the site in step with the app

- Feature text lives in `assets/js/copy.js`. Change English and French together.
- `support.html`, `privacy.html` and `terms.html` also hold the English text as static HTML for readers without JavaScript. Update it when the matching `s`, `P` or `T` entries in `copy.js` change.
- The four screenshots in `assets/img/shots/` are exported from the app (780 × 1696, WebP, English and French). Re-export them when a screen changes; the callout positions are in `AN` at the top of `assets/js/home.js`.
