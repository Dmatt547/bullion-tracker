// Entry point: wires DOM events, connects modules, and kicks off the first render.
import { S, toOz } from "./state.js";
import { render } from "./ui.js";
import { initFirebase, setRender } from "./firebase.js";
import { fetchLive, startAutoRefresh } from "./prices.js";
import { exportCSV, importCSV } from "./csv.js";

// Let firebase trigger re-renders on remote sync without a circular import.
setRender(render);
initFirebase();

// Spot price manual overrides
document.getElementById("goldSpot").oninput = e => {
  S.spot.gold = +e.target.value || 0; S.spot.src = "manual"; render();
};
document.getElementById("silverSpot").oninput = e => {
  S.spot.silver = +e.target.value || 0; S.spot.src = "manual"; render();
};

// Refresh live prices
document.getElementById("refreshBtn").onclick = fetchLive;

// Add a new holding
document.getElementById("addBtn").onclick = () => {
  const unit = document.getElementById("aUnit").value;          // "oz" or "g"
  const wIn  = +document.getElementById("aWeight").value || 0;  // value in chosen unit
  S.holdings.push({
    date: document.getElementById("aDate").value || new Date().toISOString().slice(0, 10),
    name: document.getElementById("aName").value || "Unnamed",
    metal: document.getElementById("aMetal").value,
    count: +document.getElementById("aCount").value || 0,
    weight: toOz(wIn, unit),   // stored canonically in troy oz
    unit,                      // remembered for display/edit
    cost: +document.getElementById("aCost").value || 0
  });
  document.getElementById("aName").value = "";
  document.getElementById("aCost").value = "";
  render();
};

// CSV export / import
document.getElementById("exportBtn").onclick = exportCSV;
document.getElementById("importBtn").onclick = () => document.getElementById("importFile").click();
document.getElementById("importFile").onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => { importCSV(rd.result); e.target.value = ""; };
  rd.readAsText(f);
};

// Initial paint + live prices, then auto-refresh every 5 minutes
render();
fetchLive();
startAutoRefresh();
