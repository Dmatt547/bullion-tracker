// CSV export / import of holdings.
import { S } from "./state.js";
import { render } from "./ui.js";

export function exportCSV() {
  const head = ["date", "name", "metal", "count", "weight_oz_each", "cost_aud"];
  const lines = [head.join(",")].concat(S.holdings.map(h =>
    [h.date, '"' + (h.name || "").replace(/"/g, '""') + '"', h.metal, h.count, h.weight, h.cost].join(",")));
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "bullion-holdings-" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// Minimal RFC-4180-ish parser: handles quoted fields, escaped quotes, CRLF.
function parseCSV(text) {
  const rows = [];
  let i = 0, f = "", row = [], q = false;
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        if (f !== "" || row.length) { row.push(f); rows.push(row); row = []; f = ""; }
      } else f += c;
    }
    i++;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows;
}

export function importCSV(text) {
  const rows = parseCSV(text).filter(r => r.length >= 6);
  if (!rows.length) { alert("No rows found in CSV."); return; }
  const start = /date/i.test(rows[0][0]) ? 1 : 0; // skip header if present
  const imported = [];
  for (let k = start; k < rows.length; k++) {
    const r = rows[k];
    const metal = /silver/i.test(r[2]) ? "Silver" : "Gold";
    imported.push({
      date: r[0].trim(), name: r[1].trim() || "Unnamed", metal,
      count: +r[3] || 0, weight: +r[4] || 0, cost: +r[5] || 0
    });
  }
  if (!imported.length) { alert("Couldn't parse any holdings."); return; }
  if (confirm("Import " + imported.length + " holdings? This REPLACES your current list.\n(Cancel to keep current.)")) {
    S.holdings = imported;
    S.editIdx = -1;
    render();
  }
}
