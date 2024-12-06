import { createEngine } from "../../shared/engine.js";

const { renderer, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

const ambienceSound = await audio.load({
  src: "sound/Climax.wav",
  loop: false,
});

let ambienceSoundInst = null;

function playSound() {
  if (!ambienceSoundInst) {
    ambienceSoundInst = ambienceSound.play();
  }
}

function stopSound() {
  if (ambienceSoundInst) {
    console.log("mouse up / stop sound");
    ambienceSoundInst.setVolume(0);
    ambienceSoundInst = null;
  }
}

document.addEventListener("mousedown", playSound);
document.addEventListener("mouseup", stopSound);

// Percorso del file SVG
const svgPath = "0.svg";
let ratio = { w: 3, h: 4, size: canvas.height * 0.05 };
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
const numRedCircles = 200;
const redCircles = Array.from({ length: numRedCircles }, () => ({
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 30,
  color: "rgb(0, 255, 162)",
  dx: (Math.random() - 0.5) * 8,
  dy: (Math.random() - 0.5) * 8,
  trail: [],
  targetX: null,
  targetY: null,
  onTarget: false, // Nuova proprietà
}));

// Crea array di particelle bianche
const numWhiteCircles = 200;
const whiteCircles = Array.from({ length: numWhiteCircles }, () => ({
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  color: "white",
  dx: (Math.random() - 0.5) * 8,
  dy: (Math.random() - 0.5) * 8,
  trail: [],
  targetX: null,
  targetY: null,
  onTarget: false, // Nuova proprietà
}));

// Variabile per determinare se l'animazione è iniziata
let isAnimationStarted = false;

// Variabile per determinare se le particelle devono essere posizionate sugli ellissi
let isMousePressed = false;

function update() {
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  // Pulisce il canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Disegna il file SVG se è stato caricato
  if (svgImage) {
    const imgWidth = canvas.width / 3;
    const imgHeight = canvas.height / 3;
    ctx.drawImage(
      svgImage,
      x - imgWidth / 2,
      y - imgHeight / 2,
      imgWidth,
      imgHeight
    );
  }

  // Disegna il primo ovale
  const ovalWidth = canvas.height;
  const ovalHeight = canvas.height;

  ctx.beginPath();
  ctx.ellipse(x, y, ovalWidth, ovalHeight, Math.PI / 2, 0, 2 * Math.PI);
  ctx.lineWidth = 0;
  ctx.closePath();

  // Disegna il secondo ovale (più piccolo del 25%)
  const smallOvalHeight = ovalHeight * 0.75;
  const smallOvalWidth = ovalWidth * 0.75;
  ctx.beginPath();
  ctx.ellipse(
    x,
    y,
    smallOvalWidth,
    smallOvalHeight,
    Math.PI / 2,
    0,
    2 * Math.PI
  );
  ctx.lineWidth = 3;
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
    if (!isAnimationStarted) {
      // Mantieni le particelle ferme al centro
      particle.x = x;
      particle.y = y;
    } else if (moveToOval) {
      // Se il mouse è premuto, sposta verso la posizione target
      particle.x += (particle.targetX - particle.x) * 0.03;
      particle.y += (particle.targetY - particle.y) * 0.03;

      // Controlla se la particella è sufficientemente vicina alla posizione target
      const distanceToTarget = Math.sqrt(
        (particle.x - particle.targetX) ** 2 +
          (particle.y - particle.targetY) ** 2
      );
      particle.onTarget = distanceToTarget < 5; // Imposta `onTarget` a true se è vicina alla posizione target
    } else {
      // Movimento casuale
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

      particle.onTarget = false; // Se non si muove verso un ovale, `onTarget` è false
    }

    // Disegna la particella
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, 2 * Math.PI);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.closePath();
  });
}

// Funzione per calcolare le posizioni lungo un ovale
function calculateOvalPositions(particles, targetOvalWidth, targetOvalHeight) {
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  particles.forEach((particle, i) => {
    const angle = (i / particles.length) * 2 * Math.PI;
    particle.targetX = x + targetOvalWidth * Math.cos(angle);
    particle.targetY = y + targetOvalHeight * Math.sin(angle);
  });
}

// Funzione per connettere particelle vicine con una linea
function connectParticles(particles) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i];
      const p2 = particles[j];
      const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

      // Connetti particelle solo se almeno una non è sull'ellissi
      if (!p1.onTarget && !p2.onTarget && distance < 300) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
      }
    }
  }
}

// Eventi per il mouse
canvas.addEventListener("mousedown", () => {
  if (!isAnimationStarted) {
    isAnimationStarted = true;
  } else {
    isMousePressed = true;
    calculateOvalPositions(
      redCircles,
      ratio.w * ratio.size,
      ratio.h * ratio.size
    );
    calculateOvalPositions(
      whiteCircles,
      ratio.w * ratio.size * 0.5,
      ratio.h * ratio.size * 0.6
    );
  }
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
