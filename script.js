// Sélection des éléments HTML utiles
const countrySel = d3.select("#country");
const startInput = d3.select("#start");
const endInput = d3.select("#end");
const svg = d3.select("#chart");
const btn = d3.select("#go");

// Marges du graphique pour laisser de la place aux axes
const margin = { top: 20, right: 20, bottom: 30, left: 50 };

// Liste des pays chargée depuis le fichier JSON
let countries = [];


// Transforme le fichier texte mensuel en données exploitables
function parseMonthly(text) {
  return text
    .trim()
    .split(/\n+/)
    // Ignore les lignes de commentaires
    .filter(l => l[0] !== "%")
    .map(l => {
      const [y, m, a] = l.trim().split(/\s+/);
      return { year: +y, anom: +a };
    });
}


// Regroupe les valeurs mensuelles pour obtenir une moyenne par année
function toAnnual(monthly) {
  const per = {};

  // Classe les valeurs par année
  for (const d of monthly) {
    (per[d.year] ??= []).push(d.anom);
  }

  // Calcule la moyenne annuelle
  return Object.keys(per)
    .map(y => {
      const vals = per[y].filter(v => !isNaN(v));
      const avg = vals.length
        ? vals.reduce((s, v) => s + v, 0) / vals.length
        : NaN;

      return { year: +y, anom: avg };
    })
    .sort((a, b) => a.year - b.year);
}


// Dessine le graphique dans le SVG
function draw(data) {
  // Nettoie le graphique précédent
  svg.selectAll("*").remove();
  if (!data.length) return;

  const W = +svg.attr("width");
  const H = +svg.attr("height");

  // Échelle horizontale (années)
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([margin.left, W - margin.right]);

  // Échelle verticale (anomalies de température)
  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.anom))
    .nice()
    .range([H - margin.bottom, margin.top]);

  // Axe des années
  svg.append("g")
    .attr("transform", `translate(0,${H - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  // Axe des températures
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Courbe du graphique
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => x(d.year))
      .y(d => y(d.anom))
    );
}

// Désactive le bouton tant que les pays ne sont pas chargés
btn.property("disabled", true);

// Charge la liste des pays depuis le fichier JSON
d3.json("../graphique/countries.json").then(d => {
  countries = d;
  btn.property("disabled", false);
});


// Action déclenchée quand on clique sur le bouton
btn.on("click", async () => {
  const idx = +countrySel.node().value;
  const y0 = +startInput.node().value;
  const y1 = +endInput.node().value;
  const c = countries[idx];
  if (!c) return;

  // Charge le fichier de données du pays sélectionné
  const txt = await d3.text("../" + c.file);

  // Convertit les données et filtre selon les années choisies
  const data = toAnnual(parseMonthly(txt))
    .filter(d => d.year >= y0 && d.year <= y1);

  draw(data);
});
