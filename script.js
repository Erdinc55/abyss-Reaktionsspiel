const EINSTELLUNGEN = {
  zeitProZiel: 2200,  
  startTempo: 95,         
  tempoProStufe: 42,   
  faengeProStufe: 5,    
  punkteBasis: 100,   
  bestenlisteLaenge: 5,

  startGroesse: 78,    
  schrumpfProFang: 2.5,  
  minGroesse: 26, 

  minGroesseTouch: 40, 
  trefferZusatzTouch: 18, 

  toleranz: 26,        
  streiferErlaubt: 2     
};

const IST_TOUCH = window.matchMedia("(pointer: coarse)").matches;
const MIN_GROESSE = IST_TOUCH ? EINSTELLUNGEN.minGroesseTouch : EINSTELLUNGEN.minGroesse;
const TREFFER_ZUSATZ = IST_TOUCH ? EINSTELLUNGEN.trefferZusatzTouch : 0;

const Ton = (() => {
  const SCHLUESSEL = "abyss-ton";
  let kontext = null;
  let an = false;

  try { an = localStorage.getItem(SCHLUESSEL) === "an"; } catch {}

  function bereit() {
    if (!kontext) {
      const Klasse = window.AudioContext || window.webkitAudioContext;
      if (!Klasse) return false;
      kontext = new Klasse();
    }
    if (kontext.state === "suspended") kontext.resume();
    return true;
  }

  function spielen(vonHz, bisHz, dauer, form = "sine", lautstaerke = 0.18, verzoegerung = 0) {
    if (!an || !bereit()) return;
    const start = kontext.currentTime + verzoegerung;

    const osz = kontext.createOscillator();
    const verst = kontext.createGain();
    osz.type = form;
    osz.frequency.setValueAtTime(vonHz, start);
    osz.frequency.exponentialRampToValueAtTime(bisHz, start + dauer);

    verst.gain.setValueAtTime(0.0001, start);
    verst.gain.exponentialRampToValueAtTime(lautstaerke, start + 0.012);
    verst.gain.exponentialRampToValueAtTime(0.0001, start + dauer);

    osz.connect(verst).connect(kontext.destination);
    osz.start(start);
    osz.stop(start + dauer + 0.02);
  }

  return {
    istAn: () => an,

    umschalten() {
      an = !an;
      try { localStorage.setItem(SCHLUESSEL, an ? "an" : "aus"); } catch {}
      if (an) bereit();
      return an;
    },

    fang(stufe) {
      const grund = 520 * Math.pow(2, Math.min(stufe - 1, 12) / 12);
      spielen(grund, grund * 1.5, 0.14);
    },
    stufeAuf() {
      spielen(660, 660, 0.12, "sine", 0.14, 0);
      spielen(990, 990, 0.18, "sine", 0.14, 0.1);
    },
    streifer() { spielen(220, 150, 0.16, "triangle", 0.2); },
    ende()     { spielen(420, 110, 0.55, "sine", 0.2); }
  };
})();

const SPEICHER_SCHLUESSEL = "abyss-bestenliste";


const tank = document.getElementById("tank");
const orb = document.getElementById("orb");
const hud = document.getElementById("hud");
const fuse = document.getElementById("fuse");
const fuseFill = document.getElementById("fuse-fill");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const lastTimeEl = document.getElementById("last-time");
const spareEl = document.getElementById("spare");
const tonKnopf = document.getElementById("ton");

const veilStart = document.getElementById("veil-start");
const veilEnd = document.getElementById("veil-end");
const verdictEl = document.getElementById("verdict");
const finalScoreEl = document.getElementById("final-score");
const finalMetaEl = document.getElementById("final-meta");
const boardList = document.getElementById("board-list");

const btnStart = document.getElementById("btn-start");
const btnAgain = document.getElementById("btn-again");


let laeuft = false;
let punkte = 0;
let stufe = 1;
let faenge = 0;
let reaktionszeiten = [];
let streifer = 0;     

let pos = { x: 0, y: 0 };     
let richtung = { x: 1, y: 1 }; 
let tempo = EINSTELLUNGEN.startTempo;
let groesse = EINSTELLUNGEN.startGroesse; 

let zielErschienenUm = 0;
let letzterFrame = 0;
let animationsId = null;


function zufall(min, max) {
  return Math.random() * (max - min) + min;
}

function orbZeichnen() {
  orb.style.width = groesse + "px";
  orb.style.height = groesse + "px";
  orb.style.left = pos.x + "px";
  orb.style.top = pos.y + "px";
}

function neuesZielPlatzieren() {
  const maxX = tank.clientWidth - groesse;
  const maxY = tank.clientHeight - groesse;

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


function schleife(jetzt) {
  if (!laeuft) return;

  const delta = (jetzt - letzterFrame) / 1000;
  letzterFrame = jetzt;

  const maxX = tank.clientWidth - groesse;
  const maxY = tank.clientHeight - groesse;
  const minY = 130;

  pos.x += richtung.x * tempo * delta;
  pos.y += richtung.y * tempo * delta;

  if (pos.x <= 0) { pos.x = 0; richtung.x *= -1; }
  if (pos.x >= maxX) { pos.x = maxX; richtung.x *= -1; }
  if (pos.y <= minY) { pos.y = minY; richtung.y *= -1; }
  if (pos.y >= maxY) { pos.y = maxY; richtung.y *= -1; }

  orbZeichnen();

  const vergangen = jetzt - zielErschienenUm;
  const anteil = Math.max(0, 1 - vergangen / EINSTELLUNGEN.zeitProZiel);
  fuseFill.style.transform = `scaleX(${anteil})`;

  if (anteil < 0.25) {
    orb.classList.add("panic");
  }

  if (vergangen >= EINSTELLUNGEN.zeitProZiel) {
    spielEnde("Das Licht ist entkommen");
    return;
  }

  animationsId = requestAnimationFrame(schleife);
}


function welleAn(x, y, art = "") {
  const welle = document.createElement("div");
  welle.className = "ripple" + (art ? " " + art : "");
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
  streifer = 0;
  spareEl.textContent = EINSTELLUNGEN.streiferErlaubt;
  spareEl.classList.remove("knapp");

  veilStart.classList.add("hidden");
  veilEnd.classList.add("hidden");
  hud.classList.add("live");
  fuse.classList.add("live");

  neuesZielPlatzieren();
  letzterFrame = performance.now();
  animationsId = requestAnimationFrame(schleife);
}

function lichtGefangen(event) {
  event.stopPropagation(); 

  const reaktion = Math.round(performance.now() - zielErschienenUm);
  reaktionszeiten.push(reaktion);

  const bonus = Math.max(0, EINSTELLUNGEN.zeitProZiel - reaktion);
  const gewinn = Math.round((EINSTELLUNGEN.punkteBasis + bonus / 10) * stufe);
  punkte += gewinn;
  faenge++;

  if (faenge % EINSTELLUNGEN.faengeProStufe === 0) {
    stufe++;
    tempo = EINSTELLUNGEN.startTempo + (stufe - 1) * EINSTELLUNGEN.tempoProStufe;
    Ton.stufeAuf();
  } else {
    Ton.fang(stufe);
  }

  scoreEl.textContent = punkte;
  levelEl.textContent = stufe;
  lastTimeEl.textContent = reaktion + " ms";

  const mitte = groesse / 2;
  funkenAn(pos.x + mitte, pos.y + mitte);
  tank.classList.add("caught");
  setTimeout(() => tank.classList.remove("caught"), 260);

  groesse = Math.max(
    MIN_GROESSE,
    groesse - EINSTELLUNGEN.schrumpfProFang
  );

  neuesZielPlatzieren();
}

function fehlklick(event) {
  if (!laeuft) return;

  const rahmen = tank.getBoundingClientRect();
  const klickX = event.clientX - rahmen.left;
  const klickY = event.clientY - rahmen.top;
  const mitteX = pos.x + groesse / 2;
  const mitteY = pos.y + groesse / 2;

  const abstandZurKante = Math.hypot(klickX - mitteX, klickY - mitteY)
                        - (groesse / 2 + TREFFER_ZUSATZ);

  const knapp = abstandZurKante <= EINSTELLUNGEN.toleranz;

  if (knapp && streifer < EINSTELLUNGEN.streiferErlaubt) {
    streifer++;
    const uebrig = EINSTELLUNGEN.streiferErlaubt - streifer;
    spareEl.textContent = uebrig;
    spareEl.classList.toggle("knapp", uebrig === 0);
    welleAn(klickX, klickY, "streifer");
    Ton.streifer();
    return;
  }

  welleAn(klickX, klickY);
  spielEnde(knapp ? "Zum dritten Mal knapp daneben" : "Daneben gegriffen");
}

function spielEnde(grund) {
  laeuft = false;
  cancelAnimationFrame(animationsId);
  Ton.ende();

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
  }

  return gekuerzt.indexOf(eintrag); 
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

orb.style.setProperty("--trefferzusatz", TREFFER_ZUSATZ + "px");

function tonKnopfZeigen() {
  const an = Ton.istAn();
  tonKnopf.setAttribute("aria-pressed", String(an));
  tonKnopf.setAttribute("aria-label", an ? "Ton ausschalten" : "Ton einschalten");
  tonKnopf.classList.toggle("an", an);
}

tonKnopf.addEventListener("click", () => {
  Ton.umschalten();
  tonKnopfZeigen();
  if (Ton.istAn()) Ton.fang(1);
});

tonKnopfZeigen();

orb.addEventListener("pointerdown", lichtGefangen);
tank.addEventListener("pointerdown", fehlklick);

btnStart.addEventListener("click", spielStart);
btnAgain.addEventListener("click", spielStart);

window.addEventListener("resize", () => {
  if (!laeuft) return;
  pos.x = Math.max(0, Math.min(pos.x, tank.clientWidth - groesse));
  pos.y = Math.max(130, Math.min(pos.y, tank.clientHeight - groesse));
  orbZeichnen();
});
