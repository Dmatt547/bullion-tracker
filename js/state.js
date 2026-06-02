// Shared application state + persistence + formatting helpers.
// Everything mutable lives on the single `S` object so other modules can
// reassign arrays (e.g. on Firebase sync) and all modules see the change.

export const SEED_SPOT = { gold: 6323.46, silver: 105.78, src: "seeded" };

export const DEFAULT_HOLDINGS = [
  { date: "2025-02-06", name: "Royal Canadian Mint 1oz", metal: "Gold", count: 2, weight: 1, cost: 4655 },
  { date: "2025-02-06", name: "Royal Canadian Mint 1oz", metal: "Gold", count: 1, weight: 1, cost: 3655 },
  { date: "2025-02-06", name: "Royal Canadian Mint 1oz", metal: "Gold", count: 1, weight: 1, cost: 4655 },
  { date: "2025-02-06", name: "Royal Canadian Mint 1oz", metal: "Gold", count: 1, weight: 1, cost: 4655 },
  { date: "2026-02-11", name: "Silver round", metal: "Silver", count: 1, weight: 1, cost: 90 }
];

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch (e) { return fallback; }
}

export const S = {
  spot: load("bt_spot", { ...SEED_SPOT }),
  holdings: load("bt_holdings", DEFAULT_HOLDINGS),
  history: load("bt_history", []),
  editIdx: -1
};

export function saveLocal() {
  localStorage.setItem("bt_spot", JSON.stringify(S.spot));
  localStorage.setItem("bt_holdings", JSON.stringify(S.holdings));
  localStorage.setItem("bt_history", JSON.stringify(S.history));
}

// ---- formatting helpers ----
export const fmt  = n => "$" + n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmt0 = n => "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
export const pct  = n => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
export const spotFor = m => (m === "Gold" ? S.spot.gold : S.spot.silver);
