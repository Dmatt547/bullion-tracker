// Chart.js rendering. `Chart` is the global from the CDN <script> in index.html.
import { S } from "./state.js";

let pieChart, barChart, histChart;

export function drawCharts(goldVal, silverVal, cost, val) {
  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();
  if (histChart) histChart.destroy();

  pieChart = new Chart(document.getElementById("pie"), {
    type: "doughnut",
    data: { labels: ["Gold", "Silver"], datasets: [{ data: [goldVal, silverVal], backgroundColor: ["#c9a227", "#8a9099"] }] },
    options: { plugins: { legend: { position: "bottom" } } }
  });

  barChart = new Chart(document.getElementById("bar"), {
    type: "bar",
    data: { labels: ["Invested", "Current"], datasets: [{ data: [cost, val], backgroundColor: ["#9aa3ad", "#2b6cb0"] }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => "$" + v.toLocaleString() } } } }
  });

  histChart = new Chart(document.getElementById("hist"), {
    type: "line",
    data: {
      labels: S.history.map(h => h.d),
      datasets: [{
        data: S.history.map(h => h.v),
        borderColor: "#2b6cb0", backgroundColor: "rgba(43,108,176,.12)",
        fill: true, tension: .25, pointRadius: S.history.length > 30 ? 0 : 3
      }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => "$" + v.toLocaleString() } } } }
  });
}
