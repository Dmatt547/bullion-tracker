// All DOM rendering: summary cards, holdings table (with inline edit),
// cost-basis panel, and history snapshotting. render() is the single entry point.
import { S, fmt, fmt0, pct, spotFor, saveLocal } from "./state.js";
import { drawCharts } from "./charts.js";
import { cloudSave } from "./firebase.js";

const card = (l, v) => '<div class="card"><div class="lbl">' + l + '</div><div class="val">' + v + "</div></div>";

function snapshotHistory(tVal) {
  const today = new Date().toISOString().slice(0, 10);
  const last = S.history[S.history.length - 1];
  if (last && last.d === today) last.v = tVal;
  else S.history.push({ d: today, v: tVal });
  if (S.history.length > 365) S.history = S.history.slice(-365);
}

function renderBasis(b) {
  const wrap = document.getElementById("basisPanel");
  const body = document.getElementById("basisRows");
  const metals = ["Gold", "Silver"].filter(m => b[m].wt > 0);
  if (!metals.length) { wrap.style.display = "none"; return; }
  wrap.style.display = "";
  body.innerHTML = "";
  metals.forEach(m => {
    const avg = b[m].cost / b[m].wt;
    const cur = spotFor(m);
    const pl = cur * b[m].wt - b[m].cost;
    const cls = pl >= 0 ? "up" : "down";
    body.insertAdjacentHTML("beforeend", "<tr>" +
      '<td><span class="metal"><span class="dot ' + (m === "Gold" ? "g" : "s") + '"></span>' + m + "</span></td>" +
      "<td>" + b[m].wt.toFixed(2) + "</td><td>" + fmt(b[m].cost) + "</td>" +
      "<td>" + fmt(avg) + "</td><td>" + fmt(cur) + "</td>" +
      "<td>" + fmt(avg) + "</td>" +
      '<td><span class="pill ' + cls + '">' + fmt(pl) + "</span></td></tr>");
  });
}

export function render() {
  document.getElementById("goldSpot").value = S.spot.gold;
  document.getElementById("silverSpot").value = S.spot.silver;
  document.getElementById("srcNote").textContent = "Source: " + (S.spot.src || "manual");

  let tCost = 0, tVal = 0, goldVal = 0, silverVal = 0;
  const basis = { Gold: { wt: 0, cost: 0 }, Silver: { wt: 0, cost: 0 } };
  const rows = document.getElementById("rows");
  rows.innerHTML = "";

  S.holdings.forEach((h, i) => {
    const wt = h.count * h.weight;
    const val = wt * spotFor(h.metal);
    const profit = val - h.cost;
    const pc = h.cost > 0 ? profit / h.cost * 100 : 0;
    const ppoz = wt > 0 ? h.cost / wt : 0;
    tCost += h.cost; tVal += val;
    if (h.metal === "Gold") goldVal += val; else silverVal += val;
    basis[h.metal].wt += wt; basis[h.metal].cost += h.cost;

    if (i === S.editIdx) {
      rows.insertAdjacentHTML("beforeend", "<tr>" +
        '<td><input class="editcell" id="eDate" type="date" value="' + h.date + '"></td>' +
        '<td><input class="editcell" id="eName" value="' + h.name.replace(/"/g, "&quot;") + '"></td>' +
        '<td><select class="editcell" id="eMetal"><option' + (h.metal === "Gold" ? " selected" : "") + '>Gold</option><option' + (h.metal === "Silver" ? " selected" : "") + '>Silver</option></select></td>' +
        '<td><input class="editcell" id="eCount" type="number" step="0.01" value="' + h.count + '"></td><td>oz</td>' +
        '<td><input class="editcell" id="eWeight" type="number" step="0.0001" value="' + h.weight + '"></td>' +
        '<td><input class="editcell" id="eCost" type="number" step="0.01" value="' + h.cost + '"></td>' +
        '<td colspan="4" style="text-align:left;color:var(--muted)">Weight ea (oz) &amp; total cost in AUD</td>' +
        '<td style="white-space:nowrap"><button class="mini" id="saveEdit">Save</button> <button class="edit" id="cancelEdit">✕</button></td></tr>');
    } else {
      const cls = profit >= 0 ? "up" : "down";
      rows.insertAdjacentHTML("beforeend", "<tr>" +
        "<td>" + h.date + "</td><td>" + h.name + "</td>" +
        '<td><span class="metal"><span class="dot ' + (h.metal === "Gold" ? "g" : "s") + '"></span>' + h.metal + "</span></td>" +
        "<td>" + h.count + "</td><td>oz</td><td>" + wt.toFixed(2) + "</td>" +
        "<td>" + fmt(h.cost) + "</td><td>" + fmt(val) + "</td>" +
        '<td><span class="pill ' + cls + '">' + fmt(profit) + "</span></td>" +
        '<td><span class="pill ' + cls + '">' + pct(pc) + "</span></td>" +
        "<td>" + fmt(ppoz) + "</td>" +
        '<td style="white-space:nowrap"><button class="edit" data-edit="' + i + '" title="Edit">✎</button><button class="del" data-i="' + i + '" title="Remove">✕</button></td></tr>');
    }
  });

  renderBasis(basis);

  const tProfit = tVal - tCost;
  const tPc = tCost > 0 ? tProfit / tCost * 100 : 0;
  const fcls = tProfit >= 0 ? "up" : "down";
  document.getElementById("foot").innerHTML = '<tr><td colspan="6">TOTAL</td>' +
    "<td>" + fmt(tCost) + "</td><td>" + fmt(tVal) + "</td>" +
    '<td><span class="pill ' + fcls + '">' + fmt(tProfit) + "</span></td>" +
    '<td><span class="pill ' + fcls + '">' + pct(tPc) + '</span></td><td colspan="2"></td></tr>';

  document.getElementById("cards").innerHTML =
    card("Total invested", fmt0(tCost)) + card("Current value", fmt0(tVal)) +
    card("Total profit", '<span class="pill ' + fcls + '" style="font-size:20px">' + fmt0(tProfit) + "</span>") +
    card("Return", '<span class="pill ' + fcls + '" style="font-size:20px">' + pct(tPc) + "</span>");

  snapshotHistory(tVal);
  drawCharts(goldVal, silverVal, tCost, tVal);
  saveLocal();
  cloudSave();
  wireRowButtons();
}

function wireRowButtons() {
  document.querySelectorAll(".del").forEach(b => b.onclick = () => {
    if (confirm("Remove this holding?")) { S.holdings.splice(+b.dataset.i, 1); S.editIdx = -1; render(); }
  });
  document.querySelectorAll(".edit[data-edit]").forEach(b => b.onclick = () => {
    S.editIdx = +b.dataset.edit; render();
  });
  const se = document.getElementById("saveEdit");
  if (se) {
    se.onclick = () => {
      const h = S.holdings[S.editIdx];
      h.date = document.getElementById("eDate").value || h.date;
      h.name = document.getElementById("eName").value || "Unnamed";
      h.metal = document.getElementById("eMetal").value;
      h.count = +document.getElementById("eCount").value || 0;
      h.weight = +document.getElementById("eWeight").value || 0;
      h.cost = +document.getElementById("eCost").value || 0;
      S.editIdx = -1; render();
    };
    document.getElementById("cancelEdit").onclick = () => { S.editIdx = -1; render(); };
  }
}
