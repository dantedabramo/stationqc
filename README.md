# stationqc

The StationQC website: a scroll story from orbit down into Montréal and into the app, the province's prices falling into the shape of Québec, support and legal pages, and a TestFlight beta sign-up.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Home page (the Earth scene is inlined so the page also works opened from disk) |
| `support.html`, `privacy.html`, `terms.html` | Support and legal pages |
| `subscribe.php` | Receives beta sign-ups, emails them and saves a copy |
| `data/` | Fallback storage for sign-ups, blocked from the web by `.htaccess` |
| `assets/css/site.css` | All styles, including the liquid glass material |
| `assets/js/copy.js` | Every piece of text, English and French, including the legal pages |
| `assets/js/core.js` | Language, glass tab bar, smooth scrolling, footer |
| `assets/js/home.js` | Loader, the scroll story, the Québec pins, FAQ and beta form |
| `assets/js/doc.js` | Support and legal pages |
| `assets/img/shots/` | Real app screenshots, English and French |

Old links such as `index.html#/privacy` redirect to the new pages.

## Beta sign-ups

- Sign-ups are handled by Formspree, so the site can remain hosted on GitHub Pages.
- The form endpoint is configured in the `action` attribute of the beta form in `index.html`.
- Opened from disk (`file://`), the form says it works once the site is online.
- To invite someone: App Store Connect → TestFlight → External Testing → add their email.

## Before launch

- Set the real App Store link in `APP_STORE_URL` at the top of `assets/js/core.js`.
- The Earth model and textures load from a third-party bucket (`api.getlayers.ai`). Copy `planet.glb` and `planet-lights.glb` to your own hosting and update `BASE` in the globe script in `index.html`.
- The privacy policy and terms were updated on November 10, 2026 for price alerts, the beta form and TestFlight. Have them reviewed if you need legal certainty.
