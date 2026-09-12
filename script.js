/* ============================================================
   Abyss — Fang das Licht
   Ein Reaktionsspiel im Überlebensmodus.
   ============================================================ */

/* --- Einstellungen: hier kannst du das Spiel austarieren --- */

const EINSTELLUNGEN = {
  zeitProZiel: 2200,      // Millisekunden, die du pro Licht hast
  startTempo: 95,         // Pixel pro Sekunde auf Tiefenstufe 1
  tempoProStufe: 42,      // wie viel schneller es pro Stufe wird
  faengeProStufe: 5,      // so viele Fänge bis zur nächsten Tiefenstufe
  punkteBasis: 100,       // Grundpunkte pro Fang
  bestenlisteLaenge: 5,

  startGroesse: 78,       // Durchmesser des Lichts in Pixeln zu Beginn
  schrumpfProFang: 2.5,   // um so viele Pixel wird es pro Fang kleiner
  minGroesse: 26          // kleiner als das wird es nie
};

const SPEICHER_SCHLUESSEL = "abyss-bestenliste";

/* --- Elemente aus dem HTML holen --- */

const tank = document.getElementById("tank");
const orb = document.getElementById("orb");
const hud = document.getElementById("hud");
const fuse = document.getElementById("fuse");
const fuseFill = document.getElementById("fuse-fill");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const lastTimeEl = document.getElementById("last-time");

const veilStart = document.getElementById("veil-start");
const veilEnd = document.getElementById("veil-end");
const verdictEl = document.getElementById("verdict");
const finalScoreEl = document.getElementById("final-score");
const finalMetaEl = document.getElementById("final-meta");
const boardList = document.getElementById("board-list");

const btnStart = document.getElementById("btn-start");
const btnAgain = document.getElementById("btn-again");

/* --- Spielzustand --- */

let laeuft = false;
let punkte = 0;
let stufe = 1;
let faenge = 0;
let reaktionszeiten = [];

let pos = { x: 0, y: 0 };      // Position des Lichts
let richtung = { x: 1, y: 1 }; // Bewegungsrichtung (normalisiert)
let tempo = EINSTELLUNGEN.startTempo;
let groesse = EINSTELLUNGEN.startGroesse; // aktueller Durchmesser des Lichts

let zielErschienenUm = 0;
let letzterFrame = 0;
let animationsId = null;

/* --- Hilfsfunktionen --- */

function zufall(min, max) {
  return Math.random() * (max - min) + min;
}

// Schreibt Position und Größe ins CSS.
// Wichtig: NICHT über transform, denn transform gehört der Puls-Animation.
function orbZeichnen() {
  orb.style.width = groesse + "px";
  orb.style.height = groesse + "px";
  orb.style.left = pos.x + "px";
  orb.style.top = pos.y + "px";
}

// Setzt das Licht an eine zufällige Stelle mit zufälliger Richtung
function neuesZielPlatzieren() {
  const maxX = tank.clientWidth - groesse;
  const maxY = tank.clientHeight - groesse;

  // Der obere Bereich bleibt frei, damit das HUD nicht verdeckt wird
  const minY = 130;

  pos.x = zufall(0, Math.max(0, maxX));
  pos.y = zufall(minY, Math.max(minY, maxY));

  const winkel = zufall(0, Math.PI * 2);
  richtung.x = Math.cos(winkel);
  richtung.y = Math.sin(winkel);

  orbZeichnen();
  orb.classList.remove("panic");
  orb.classList.add("live");

  zielErschienenUm = performance.now();
}

/* --- Die Animationsschleife: bewegt das Licht und prüft die Zeit --- */

function schleife(jetzt) {
  if (!laeuft) return;

  const delta = (jetzt - letzterFrame) / 1000; // Sekunden seit letztem Frame
  letzterFrame = jetzt;

  const maxX = tank.clientWidth - groesse;
  const maxY = tank.clientHeight - groesse;
  const minY = 130;

  // Bewegen
  pos.x += richtung.x * tempo * delta;
  pos.y += richtung.y * tempo * delta;

  // An den Rändern abprallen
  if (pos.x <= 0) { pos.x = 0; richtung.x *= -1; }
  if (pos.x >= maxX) { pos.x = maxX; richtung.x *= -1; }
  if (pos.y <= minY) { pos.y = minY; richtung.y *= -1; }
  if (pos.y >= maxY) { pos.y = maxY; richtung.y *= -1; }

  orbZeichnen();

  // Verbleibende Zeit als Balken anzeigen
  const vergangen = jetzt - zielErschienenUm;
  const anteil = Math.max(0, 1 - vergangen / EINSTELLUNGEN.zeitProZiel);
  fuseFill.style.transform = `scaleX(${anteil})`;

  // Letztes Viertel: das Licht wechselt die Farbe
  if (anteil < 0.25) {
    orb.classList.add("panic");
  }

  // Zeit abgelaufen -> Spielende
  if (vergangen >= EINSTELLUNGEN.zeitProZiel) {
    spielEnde("Das Licht ist entkommen");
    return;
  }

  animationsId = requestAnimationFrame(schleife);
}

/* --- Effekte --- */

function welleAn(x, y) {
  const welle = document.createElement("div");
  welle.className = "ripple";
  welle.style.left = x + "px";
  welle.style.top = y + "px";
  welle.style.transform = "translate(-50%, -50%)";
  tank.appendChild(welle);
  setTimeout(() => welle.remove(), 600);
}

function funkenAn(x, y) {
  const farben = ["#4fe3d6", "#ffc46b", "#e8f6f6"];
  for (let i = 0; i < 10; i++) {
    const funke = document.createElement("div");
    funke.className = "spark";
    const winkel = (Math.PI * 2 * i) / 10;
    const weite = zufall(40, 90);
    funke.style.left = x + "px";
    funke.style.top = y + "px";
    funke.style.background = farben[i % farben.length];
    funke.style.setProperty("--dx", Math.cos(winkel) * weite + "px");
    funke.style.setProperty("--dy", Math.sin(winkel) * weite + "px");
    tank.appendChild(funke);
    setTimeout(() => funke.remove(), 650);
  }
}

/* --- Spielablauf --- */

function spielStart() {
  laeuft = true;
  punkte = 0;
  stufe = 1;
  faenge = 0;
  reaktionszeiten = [];
  tempo = EINSTELLUNGEN.startTempo;
  groesse = EINSTELLUNGEN.startGroesse;

  scoreEl.textContent = "0";
  levelEl.textContent = "1";
  lastTimeEl.textContent = "—";

  veilStart.classList.add("hidden");
  veilEnd.classList.add("hidden");
  hud.classList.add("live");
  fuse.classList.add("live");

  neuesZielPlatzieren();
  letzterFrame = performance.now();
  animationsId = requestAnimationFrame(schleife);
}

function lichtGefangen(event) {
  event.stopPropagation(); // verhindert, dass der Klick als Fehlklick zählt

  const reaktion = Math.round(performance.now() - zielErschienenUm);
  reaktionszeiten.push(reaktion);

  // Punkte: Grundwert plus Bonus für Schnelligkeit, mal Tiefenstufe
  const bonus = Math.max(0, EINSTELLUNGEN.zeitProZiel - reaktion);
  const gewinn = Math.round((EINSTELLUNGEN.punkteBasis + bonus / 10) * stufe);
  punkte += gewinn;
  faenge++;

  // Tiefenstufe erhöhen
  if (faenge % EINSTELLUNGEN.faengeProStufe === 0) {
    stufe++;
    tempo = EINSTELLUNGEN.startTempo + (stufe - 1) * EINSTELLUNGEN.tempoProStufe;
  }

  scoreEl.textContent = punkte;
  levelEl.textContent = stufe;
  lastTimeEl.textContent = reaktion + " ms";

  // Effekte noch an der alten Position und Größe auslösen
  const mitte = groesse / 2;
  funkenAn(pos.x + mitte, pos.y + mitte);
  tank.classList.add("caught");
  setTimeout(() => tank.classList.remove("caught"), 260);

  // Das Licht wird mit jedem Fang ein Stück kleiner
  groesse = Math.max(
    EINSTELLUNGEN.minGroesse,
    groesse - EINSTELLUNGEN.schrumpfProFang
  );

  neuesZielPlatzieren();
}

function fehlklick(event) {
  if (!laeuft) return;
  welleAn(event.clientX, event.clientY);
  spielEnde("Daneben gegriffen");
}

function spielEnde(grund) {
  laeuft = false;
  cancelAnimationFrame(animationsId);

  orb.classList.remove("live", "panic");
  hud.classList.remove("live");
  fuse.classList.remove("live");

  verdictEl.textContent = grund;
  finalScoreEl.textContent = punkte;

  const beste = reaktionszeiten.length ? Math.min(...reaktionszeiten) : null;
  finalMetaEl.textContent = beste
    ? `Tiefe ${stufe} · ${faenge} Lichter · schnellste Reaktion ${beste} ms`
    : `Tiefe ${stufe} · kein Licht gefangen`;

  const eintrag = { punkte, stufe, beste, faenge };
  const platz = bestenlisteSpeichern(eintrag);
  bestenlisteZeichnen(platz);

  veilEnd.classList.remove("hidden");
}

/* --- Bestenliste (bleibt im Browser gespeichert) --- */

function bestenlisteLaden() {
  try {
    const roh = localStorage.getItem(SPEICHER_SCHLUESSEL);
    return roh ? JSON.parse(roh) : [];
  } catch {
    return [];
  }
}

function bestenlisteSpeichern(eintrag) {
  const liste = bestenlisteLaden();
  liste.push(eintrag);
  liste.sort((a, b) => b.punkte - a.punkte);
  const gekuerzt = liste.slice(0, EINSTELLUNGEN.bestenlisteLaenge);

  try {
    localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(gekuerzt));
  } catch {
    // Speichern nicht möglich (z. B. private Browser-Sitzung) — Spiel läuft trotzdem
  }

  return gekuerzt.indexOf(eintrag); // -1, wenn der Lauf es nicht in die Liste geschafft hat
}

function bestenlisteZeichnen(frischerPlatz) {
  const liste = bestenlisteLaden();
  boardList.innerHTML = "";

  if (liste.length === 0) {
    const leer = document.createElement("p");
    leer.className = "board-empty";
    leer.textContent = "Noch keine Läufe gespeichert.";
    boardList.appendChild(leer);
    return;
  }

  liste.forEach((eintrag, index) => {
    const zeile = document.createElement("li");
    if (index === frischerPlatz) zeile.classList.add("fresh");

    const wert = document.createElement("b");
    wert.textContent = eintrag.punkte;

    const info = document.createElement("span");
    info.textContent = eintrag.beste
      ? `Tiefe ${eintrag.stufe} · ${eintrag.beste} ms`
      : `Tiefe ${eintrag.stufe}`;

    zeile.append(wert, info);
    boardList.appendChild(zeile);
  });
}

/* --- Ereignisse verbinden --- */

orb.addEventListener("pointerdown", lichtGefangen);
tank.addEventListener("pointerdown", fehlklick);

btnStart.addEventListener("click", spielStart);
btnAgain.addEventListener("click", spielStart);

// Fenstergröße geändert: Licht zurück ins Bild holen
window.addEventListener("resize", () => {
  if (!laeuft) return;
  pos.x = Math.max(0, Math.min(pos.x, tank.clientWidth - groesse));
  pos.y = Math.max(130, Math.min(pos.y, tank.clientHeight - groesse));
  orbZeichnen();
});
