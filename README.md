# Bullion Tracker

A live gold & silver portfolio tracker (AUD) with Google sign-in, cross-device
sync via Firebase, live spot prices, CSV import/export, inline editing, and
charts.

## File structure

```
bullion-tracker/
├── index.html          # Markup only — loads the CSS and js/main.js
├── css/
│   └── styles.css      # All styling
└── js/
    ├── config.js       # Firebase project config (safe to be public)
    ├── state.js        # Shared state object `S`, defaults, localStorage, formatters
    ├── firebase.js     # Google auth + Firestore sync (debounced save, live snapshot)
    ├── prices.js       # Live spot prices: gold-api.com (USD) + frankfurter.dev (FX)
    ├── charts.js       # Chart.js: allocation, cost-vs-value, history line
    ├── csv.js          # Export / import holdings as CSV
    ├── ui.js           # render() — cards, holdings table, inline edit, cost-basis panel
    └── main.js         # Entry point: wires DOM events, boots everything
```

## How the modules connect

`main.js` is the only entry point (`<script type="module" src="js/main.js">`).
State lives on a single mutable object `S` in `state.js` so any module can
update holdings/spot/history and everyone sees it.

To avoid a circular import, `firebase.js` doesn't import `ui.js`; instead
`main.js` calls `setRender(render)` so Firebase can trigger re-renders on remote
sync. `Chart` is a global loaded from the CDN `<script>` tag in `index.html`.

## Running locally

ES modules don't work from `file://`, so use a tiny local server:

```bash
cd bullion-tracker
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying

Drag the **whole `bullion-tracker` folder** onto https://app.netlify.com/drop
(not just index.html — it needs the css/ and js/ files). After deploy, add your
`*.netlify.app` domain under Firebase → Authentication → Settings → Authorized
domains so Google sign-in works.

## Configuration

- Firebase: edit `js/config.js`.
- Seed holdings / default spot prices: edit `js/state.js`.
- Price sources: edit `js/prices.js`.
