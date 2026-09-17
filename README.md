# Abyss

Ein Reaktionsspiel. Ein leuchtender Punkt treibt durch dunkles Wasser, du musst
ihn anklicken, bevor er dir entwischt. Ein Fehlklick oder eine abgelaufene Zeit
beenden den Lauf sofort.

**Live:** https://erdinc55.github.io/abyss/

## Wie es funktioniert

Pro Ziel hast du 2,2 Sekunden. Im letzten Viertel dieser Zeit schlägt das Licht
von Türkis nach Magenta um — das ist die Vorwarnung.

Alle fünf Treffer steigt die Tiefenstufe. Das Licht wird dann schneller, und mit
jedem einzelnen Fang schrumpft es zusätzlich ein Stück. Nach zwanzig, dreißig
Treffern jagt man einem winzigen Punkt hinterher, der quer durchs Bild schießt.

Die fünf besten Läufe werden im Browser gespeichert und bleiben nach dem
Schließen erhalten.

## Was drin steckt

Reines HTML, CSS und JavaScript, keine Bibliotheken.

- `index.html` — Aufbau
- `style.css` — Tiefsee-Optik, Leuchteffekte, Animationen
- `script.js` — Bewegung, Zeitmessung, Punkte, Bestenliste

Die Bewegung läuft über `requestAnimationFrame`. Das Licht hat eine Position und
eine Richtung, und in jedem Bild wird beides mit der vergangenen Zeit
verrechnet. An den Rändern kehrt sich die Richtung um. Dass man dabei mit der
Zeit zwischen zwei Bildern rechnen muss und nicht mit festen Schritten, war für
mich die eigentliche Erkenntnis — sonst läuft das Spiel auf einem schnellen
Bildschirm anders als auf einem langsamen.

## Ein Fehler, an dem ich länger saß

Anfangs klebte das Licht unbeweglich in der linken oberen Ecke. Ich hatte die
Position über `transform: translate(...)` gesetzt, aber im CSS lief gleichzeitig
eine Puls-Animation mit `transform: scale(...)`. Beide schreiben auf dieselbe
Eigenschaft, und die Animation gewinnt — meine Position wurde also in jedem Bild
sofort wieder überschrieben.

Die Lösung war, die Position über `left` und `top` zu setzen und `transform`
allein der Animation zu überlassen.

## Selbst ausprobieren

Repository herunterladen und `index.html` im Browser öffnen. Kein Server nötig.

```
git clone https://github.com/Erdinc55/abyss.git
```

Die Schwierigkeit lässt sich oben in `script.js` im Block `EINSTELLUNGEN`
verstellen — Zeit pro Ziel, Starttempo, wie stark das Licht pro Fang schrumpft.

## Was noch fehlt

- Auf dem Handy ist die Steuerung mit dem Finger ungenauer als mit der Maus
- Die Bestenliste liegt nur im eigenen Browser, ein Vergleich mit anderen wäre
  der nächste Schritt
