const countrySel = d3.select("#country");
const startInput = d3.select("#start");
const endInput = d3.select("#end");
const svg = d3.select("#chart");
const btn = d3.select("#go");

const margin = { top: 20, right: 20, bottom: 30, left: 50 };

let countries = [];

function parseMonthly(text) {
  return text.trim().split(/\n+/).filter(l => l[0] !== "%").map(l => {
    const [y, m, a] = l.trim().split(/\s+/);
    return { year: +y, anom: +a };
  });
}

function toAnnual(monthly) {
  const per = {};
  for (const d of monthly) (per[d.year] ??= []).push(d.anom);

  return Object.keys(per).map(y => {
    const vals = per[y].filter(v => !isNaN(v));
    const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : NaN;
    return { year: +y, anom: avg };
  }).sort((a, b) => a.year - b.year);
}

function draw(data) {
  svg.selectAll("*").remove();
  if (!data.length) return;

  const W = +svg.attr("width");
  const H = +svg.attr("height");

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([margin.left, W - margin.right]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.anom))
    .nice()
    .range([H - margin.bottom, margin.top]);

  svg.append("g")
    .attr("transform", `translate(0,${H - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.anom)));
}

btn.property("disabled", true);

d3.json("../graphique/countries.json").then(d => {
  countries = d;
  btn.property("disabled", false);
});

btn.on("click", async () => {
  const idx = +countrySel.node().value;
  const y0 = +startInput.node().value;
  const y1 = +endInput.node().value;
  const c = countries[idx];
  if (!c) return;

  const txt = await d3.text("../" + c.file);
  const data = toAnnual(parseMonthly(txt)).filter(d => d.year >= y0 && d.year <= y1);
  draw(data);
});