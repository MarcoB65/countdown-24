import { createEngine } from "../../shared/engine.js";

const { renderer, run, audio, finish } = createEngine();
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

// Crea array di particelle rosse
const numRedCircles = 100;
const redCircles = Array.from({ length: numRedCircles }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: 20,
  color: "blue",
  dx: (Math.random() - 0.5) * 8, // Velocità orizzontale
  dy: (Math.random() - 0.5) * 8, // Velocità verticale
  trail: [], // Cronologia delle posizioni
}));

// Crea array di particelle bianche
const numWhiteCircles = 100;
const whiteCircles = Array.from({ length: numWhiteCircles }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: 20,
  color: "white",
  dx: (Math.random() - 0.5) * 8, // Velocità orizzontale
  dy: (Math.random() - 0.5) * 8, // Velocità verticale
  trail: [], // Cronologia delle posizioni
}));

// Variabile per determinare se il mouse è premuto
let isMousePressed = false;

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

  // Disegna il primo ovale
  const ovalWidth = canvas.width / 4.5; // Larghezza ovale
  const ovalHeight = canvas.height / 4; // Altezza ovale

  ctx.beginPath();
  ctx.ellipse(x, y, ovalWidth, ovalHeight, 0, 0, 2 * Math.PI);
  ctx.lineWidth = 0; // Larghezza del bordo
  ctx.closePath();

  // Disegna il secondo ovale (più piccolo del 25%)
  const smallOvalHeight = ovalHeight * 0.75;
  const smallOvalWidth = ovalWidth * 0.75;
  ctx.beginPath();
  ctx.ellipse(x, y, smallOvalWidth, smallOvalHeight, 0, 0, 2 * Math.PI);
  ctx.lineWidth = 3; // Larghezza del bordo

  ctx.closePath();

  // Aggiorna e disegna particelle rosse
  updateParticles(redCircles, isMousePressed, ovalWidth, ovalHeight);

  // Aggiorna e disegna particelle bianche
  updateParticles(
    whiteCircles,
    isMousePressed,
    smallOvalWidth,
    smallOvalHeight
  );

  // Connetti particelle tra di loro se vicine
  connectParticles(redCircles);
  connectParticles(whiteCircles);
}

// Funzione per aggiornare particelle
function updateParticles(
  particles,
  moveToOval,
  targetOvalWidth,
  targetOvalHeight
) {
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  particles.forEach((particle) => {
    // Salva la posizione attuale nella scia
    particle.trail.push({ x: particle.x, y: particle.y });

    // Mantieni la scia entro un numero massimo di punti
    if (particle.trail.length > 100) {
      particle.trail.shift();
    }

    if (moveToOval && particle.targetX !== null && particle.targetY !== null) {
      // Se il mouse è premuto, sposta verso la posizione target
      particle.x += (particle.targetX - particle.x) * 0.05; // Animazione fluida
      particle.y += (particle.targetY - particle.y) * 0.05;
    } else {
      // Movimento casuale se il mouse non è premuto
      particle.x += particle.dx;
      particle.y += particle.dy;

      // Controlla i bordi del canvas e inverte la direzione
      if (
        particle.x - particle.radius < 0 ||
        particle.x + particle.radius > canvas.width
      ) {
        particle.dx *= -1;
      }
      if (
        particle.y - particle.radius < 0 ||
        particle.y + particle.radius > canvas.height
      ) {
        particle.dy *= -1;
      }
    }

    // Disegna la scia
    particle.trail.forEach((pos, index) => {
      const opacity = (index + 10) / particle.trail.length; // Opacità crescente
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, particle.radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.2})`; // Colore semi-trasparente
      ctx.fill();
      ctx.closePath();
    });

    // Disegna la particella
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, 2 * Math.PI);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.closePath();
  });
}

// Funzione per connettere particelle vicine con una linea
function connectParticles(particles) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i];
      const p2 = particles[j];
      const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

      // Se la distanza è minore di 50px, disegna una linea
      if (distance < 300) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Linea semi-trasparente
        ctx.lineWidth = 5; // Spessore linea
        ctx.stroke();
        ctx.closePath();
      }
    }
  }
}

// Funzione per calcolare le posizioni lungo un ovale
function calculateOvalPositions(particles, targetOvalWidth, targetOvalHeight) {
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  particles.forEach((particle, i) => {
    const angle = (i / particles.length) * 2 * Math.PI; // Angolo uniforme
    particle.targetX = x + targetOvalWidth * Math.cos(angle); // Posizione X
    particle.targetY = y + targetOvalHeight * Math.sin(angle); // Posizione Y
  });
}

// Eventi per il mouse
canvas.addEventListener("mousedown", () => {
  isMousePressed = true;
  calculateOvalPositions(redCircles, canvas.width / 4.5, canvas.height / 4);
  calculateOvalPositions(
    whiteCircles,
    (canvas.width / 4.5) * 0.75,
    (canvas.height / 4) * 0.75
  );
});

canvas.addEventListener("mouseup", () => {
  isMousePressed = false;
});

// Gestione del ciclo di rendering manualmente
function runCustom() {
  update();
  requestAnimationFrame(runCustom);
}
runCustom();
