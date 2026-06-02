// Live spot-price fetching: metals from gold-api.com (USD), FX from frankfurter.dev.
import { S } from "./state.js";
import { render } from "./ui.js";

const getJSON = async u => {
  const r = await fetch(u, { cache: "no-store" });
  if (!r.ok) throw new Error(u + " " + r.status);
  return r.json();
};

export async function fetchLive() {
  const live = document.getElementById("live");
  const txt = document.getElementById("liveTxt");
  txt.textContent = "fetching…";

  const [g, s, fx] = await Promise.allSettled([
    getJSON("https://api.gold-api.com/price/XAU"),
    getJSON("https://api.gold-api.com/price/XAG"),
    getJSON("https://api.frankfurter.dev/v1/latest?base=USD&symbols=AUD")
  ]);

  // FX: live rate if available, else last known, else a sensible default.
  let rate = fx.status === "fulfilled" ? fx.value.rates.AUD : (S.spot.rate || 1.52);
  if (fx.status === "fulfilled") S.spot.rate = rate;

  let ok = 0;
  if (g.status === "fulfilled") { S.spot.gold = +(g.value.price * rate).toFixed(2); ok++; }
  if (s.status === "fulfilled") { S.spot.silver = +(s.value.price * rate).toFixed(2); ok++; }

  if (ok === 2) {
    live.className = "dotlive ok";
    txt.textContent = "live";
    S.spot.src = "live " + new Date().toLocaleString("en-AU") +
      (fx.status !== "fulfilled" ? " (cached FX)" : "");
  } else {
    live.className = "dotlive err";
    txt.textContent = "price API blocked";
    if (!S.spot.src || S.spot.src === "seeded") S.spot.src = "manual / cached";
    const errs = [g, s, fx].filter(x => x.status === "rejected")
      .map(x => x.reason && x.reason.message).join(" | ");
    console.error("Bullion price fetch failed:", errs || "(blocked by CORS/network)");
  }
  render();
}
