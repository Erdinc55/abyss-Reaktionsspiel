Abyss

Ein Reaktionsspiel. Ein leuchtender Punkt treibt durch dunkles Wasser, du musst
ihn anklicken, bevor er dir entwischt. Wer zu langsam ist oder weit daneben
klickt, beendet den Lauf. Knapp daneben verzeiht das Spiel zweimal.

**Live:** https://erdinc55.github.io/abyss-Reaktionsspiel-/

## Wie es funktioniert

Pro Ziel hast du 2,2 Sekunden. Im letzten Viertel dieser Zeit schlägt das Licht
von Türkis nach Magenta um — das ist die Vorwarnung.

Alle fünf Treffer steigt die Tiefenstufe. Das Licht wird dann schneller, und mit
jedem einzelnen Fang schrumpft es zusätzlich ein Stück. Nach zwanzig, dreißig
Treffern jagt man einem winzigen Punkt hinterher, der quer durchs Bild schießt.

Die fünf besten Läufe werden im Browser gespeichert und bleiben nach dem
Schließen erhalten. Ton gibt es auch, standardmäßig aus — der Schalter sitzt
oben rechts.

## Knapp daneben

Anfangs beendete jeder Fehlklick den Lauf sofort. Ein Klick, der nur ein paar
Pixel danebengeht, fühlte sich dabei ungerecht an. Jetzt zählt ein Klick bis
26 Pixel neben dem Licht als Streifer, und zwei davon sind frei.

Die Begrenzung ist der eigentliche Punkt. Ohne sie könnte man einfach wild um
das Licht herumklicken, bis man es zufällig trifft — dann wäre es kein
Reaktionsspiel mehr.

## Mit dem Finger

Auf dem Handy war das Spiel deutlich schwerer: Der Finger ist ungenauer als
eine Maus und verdeckt das Ziel. Über die Medienabfrage `pointer: coarse`
erkennt das Spiel ein Touch-Gerät und gibt dem Licht dort einen unsichtbaren
Rand von 18 Pixeln, der ebenfalls als Treffer zählt. Außerdem schrumpft es
nicht unter 40 Pixel statt 26.

Die Breite dieses Randes steht nur an einer Stelle, im JavaScript. Das CSS
liest sie über eine Variable, und die Streifer-Messung rechnet mit demselben
Wert. So können die beiden nicht auseinanderlaufen.

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
git clone https://github.com/Erdinc55/abyss-Reaktionsspiel-.git
```

Die Schwierigkeit lässt sich oben in `script.js` im Block `EINSTELLUNGEN`
verstellen — Zeit pro Ziel, Starttempo, wie stark das Licht pro Fang schrumpft.

## Was noch fehlt

- Die Bestenliste liegt nur im eigenen Browser, ein Vergleich mit anderen wäre
  der nächste Schritt
