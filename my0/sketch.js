import { createEngine } from "../../shared/engine.js";

const { renderer } = createEngine();
const { ctx, canvas } = renderer;

// Percorso del file SVG
const svgPath = "0.svg";

// Funzione per caricare e convertire SVG in immagine
function loadSVG(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Variabile per immagine SVG
let svgImage = null;

// Carica l'SVG all'avvio
(async () => {
  try {
    svgImage = await loadSVG(svgPath);
  } catch (error) {
    console.error("Errore nel caricamento dell'SVG:", error);
  }
})();

// Crea array di palline
const numCircles = 50;
const circles = Array.from({ length: numCircles }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: 10,
  color: "red",
  dx: (Math.random() - 0.5) * 4, // Velocità orizzontale
  dy: (Math.random() - 0.5) * 4, // Velocità verticale
  targetX: null, // Obiettivo X per animazione
  targetY: null, // Obiettivo Y per animazione
}));

// Variabile per determinare se le palline devono muoversi verso l'ovale
let moveToOval = false;

function update() {
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  // Pulisce il canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Disegna il file SVG se è stato caricato
  if (svgImage) {
    const imgWidth = canvas.width / 3; // Larghezza desiderata
    const imgHeight = canvas.height / 3; // Altezza desiderata
    ctx.drawImage(
      svgImage,
      x - imgWidth / 2,
      y - imgHeight / 2,
      imgWidth,
      imgHeight
    );
  }

  // Disegna un ovale al centro con bordo bianco di 5px
  const ovalWidth = canvas.width / 4.5; // Larghezza ovale
  const ovalHeight = canvas.height / 4; // Altezza ovale

  ctx.beginPath();
  ctx.ellipse(x, y, ovalWidth, ovalHeight, 0, 0, 2 * Math.PI);
  ctx.lineWidth = 5; // Larghezza del bordo
  ctx.strokeStyle = "white"; // Colore del bordo
  ctx.stroke();
  ctx.closePath();

  // Aggiorna e disegna ogni pallina
  circles.forEach((circle, index) => {
    // Se `moveToOval` è attivo, calcola la posizione target
    if (moveToOval && circle.targetX !== null && circle.targetY !== null) {
      // Sposta la pallina verso la posizione target
      circle.x += (circle.targetX - circle.x) * 0.05; // Animazione fluida
      circle.y += (circle.targetY - circle.y) * 0.05;
    } else {
      // Movimento casuale (se non in animazione)
      circle.x += circle.dx;
      circle.y += circle.dy;

      // Controlla i bordi del canvas e inverte la direzione
      if (
        circle.x - circle.radius < 0 ||
        circle.x + circle.radius > canvas.width
      ) {
        circle.dx *= -1;
      }
      if (
        circle.y - circle.radius < 0 ||
        circle.y + circle.radius > canvas.height
      ) {
        circle.dy *= -1;
      }
    }

    // Disegna la pallina
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
    ctx.fillStyle = circle.color;
    ctx.fill();
    ctx.closePath();
  });
}

// Funzione per calcolare le posizioni lungo l'ovale
function calculateOvalPositions() {
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  const ovalWidth = canvas.width / 4.5; // Larghezza ovale
  const ovalHeight = canvas.height / 4; // Altezza ovale

  // Calcola posizioni equidistanti lungo il perimetro dell'ovale
  circles.forEach((circle, i) => {
    const angle = (i / numCircles) * 2 * Math.PI; // Angolo uniforme
    circle.targetX = x + ovalWidth * Math.cos(angle); // Posizione X
    circle.targetY = y + ovalHeight * Math.sin(angle); // Posizione Y
  });
}

// Aggiungi l'evento di click per iniziare il movimento verso l'ovale
canvas.addEventListener("click", () => {
  moveToOval = true;
  calculateOvalPositions();
});

// Gestione del ciclo di rendering manualmente
function runCustom() {
  update();
  requestAnimationFrame(runCustom);
}
runCustom();
