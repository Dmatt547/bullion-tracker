# Bullion Tracker

![CI](https://github.com/Dmatt547/bullion-tracker/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Vanilla JS](https://img.shields.io/badge/JavaScript-ES%20Modules-f7df1e?logo=javascript&logoColor=000)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ffca28?logo=firebase&logoColor=000)
![Netlify](https://img.shields.io/badge/Netlify-deployed-00c7b7?logo=netlify&logoColor=fff)

A live gold & silver portfolio tracker (AUD). Sign in with Google, add your
holdings, and see real-time spot prices, cost basis, profit/loss and charts —
synced across every device you log in on. Built with plain JavaScript ES
modules: **no framework and no build step.**

**🔗 Live demo: https://dm-bullion-tracker.netlify.app**

## Screenshot

<!-- Replace with a real screenshot any time: save it as docs/screenshot.png -->
![Bullion Tracker dashboard](docs/screenshot.png)

## Features

- **Live spot prices** — gold & silver fetched on load, then auto-refreshed every 5 minutes, and on demand via the Refresh button. USD prices are converted to AUD using a live FX rate.
- **Smart auto-refresh** — polling pauses while the browser tab is hidden to avoid wasted API calls, and catches up immediately when you return to the tab.
- **Google sign-in + cloud sync** — holdings and history follow you across devices in real time (Firebase Auth + Firestore). Not signed in? Everything still works and saves to the device.
- **Offline-friendly** — falls back to local storage and the last known prices when the price or FX APIs are unreachable, and lets you type spot prices in manually.
- **Cost basis & break-even** — blended average $/oz per metal, total cost vs current value, and unrealised profit/loss.
- **Charts** — allocation by metal, cost vs current value, and portfolio value over time (Chart.js).
- **Flexible weight entry** — add holdings in troy ounces *or* grams; weights are stored canonically in oz so all value math stays consistent.
- **CSV import/export** — back up your holdings or bulk-edit them in a spreadsheet, then re-import.
- **Inline editing** — edit or delete any holding directly in the table.

## Tech stack

| Area      | Choice                                            |
|-----------|---------------------------------------------------|
| Frontend  | Vanilla JS (ES modules), HTML, CSS — no framework |
| Charts    | Chart.js (CDN)                                    |
| Auth/DB   | Firebase Authentication + Cloud Firestore         |
| Data APIs | gold-api.com (metal spot), frankfurter.dev (USD→AUD FX) |
| Hosting   | Netlify (continuous deploy from GitHub)           |
| CI        | GitHub Actions (JS syntax validation)             |

## File structure

```
bullion-tracker/
├── index.html          # Markup only — loads the CSS and js/main.js
├── css/
│   └── styles.css      # All styling
└── js/
    ├── config.js       # Firebase project config (safe to be public)
    ├── state.js        # Shared state object `S`, seed data, localStorage, oz/g + formatters
    ├── firebase.js     # Google auth + Firestore sync (debounced save, live snapshot)
    ├── prices.js       # Live spot prices + 5-minute auto-refresh
    ├── charts.js       # Chart.js: allocation, cost-vs-value, value-over-time
    ├── csv.js          # Export / import holdings as CSV
    ├── ui.js           # render() — cards, holdings table, inline edit, cost-basis panel
    └── main.js         # Entry point: wires DOM events, boots everything
```

## How it fits together

`main.js` is the only entry point (`<script type="module" src="js/main.js">`).
All mutable state lives on a single object `S` in `state.js`, so any module can
update holdings, spot prices or history and every other module sees the change
on the next `render()`.

To avoid a circular import, `firebase.js` doesn't import `ui.js`; instead
`main.js` calls `setRender(render)` so Firebase can trigger a re-render whenever
remote data syncs in. `Chart` is a global loaded from the CDN `<script>` tag in
`index.html`.

Weights are always stored internally in **troy ounces** (spot prices are AUD/oz),
so value math is consistent. The per-holding `unit` field only remembers how you
entered a weight (oz or g) for display and editing — conversions happen behind
the scenes (`toOz` / `fromOz` in `state.js`).

## Running locally

ES modules don't load from `file://`, so serve the folder over HTTP:

```bash
cd bullion-tracker
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying

This repo deploys to Netlify automatically on every push to `main`
(`netlify.toml` publishes the folder as a static site — no build step). To
deploy a copy manually, drag the **whole `bullion-tracker` folder** onto
https://app.netlify.com/drop (it needs `css/` and `js/`, not just `index.html`).

After deploying, add your `*.netlify.app` domain under
**Firebase → Authentication → Settings → Authorized domains** so Google
sign-in works on the live URL.

## Configuration

- **Firebase project:** edit `js/config.js`. These keys are meant to be public —
  security comes from Firestore rules and the Authorized domains list, not from
  hiding the config.
- **Seed holdings / default spot prices:** edit `DEFAULT_HOLDINGS` and `SEED_SPOT`
  in `js/state.js`.
- **Price / FX sources and refresh interval:** edit `js/prices.js`.

## License

MIT — see [LICENSE](LICENSE).
