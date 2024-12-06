import { createEngine } from "../../../shared/engine.js";

const { renderer, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

//SOUND PART
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
    ambienceSoundInst.setVolume(0);
    ambienceSoundInst = null;
  }
}

document.addEventListener("mousedown", playSound);
document.addEventListener("mouseup", stopSound);

const svgPath = "0.svg";
let ratio = { w: 3, h: 4, size: canvas.height * 0.05 };

function loadSVG(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

let svgImage = null;

(async () => {
  try {
    svgImage = await loadSVG(svgPath);
  } catch (error) {
    console.error("Errore nel caricamento dell'SVG:", error);
  }
})();

//1°CIRCLE
const numRedCircles = 250;
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
  onTarget: false,
}));

//2° CIRCLE
const numWhiteCircles = 250;
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
  onTarget: false,
}));

let isAnimationStarted = false;
let isMousePressed = false;

function update() {
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  const ovalWidth = canvas.height;
  const ovalHeight = canvas.height;

  ctx.beginPath();
  ctx.ellipse(x, y, ovalWidth, ovalHeight, Math.PI / 2, 0, 2 * Math.PI);
  ctx.lineWidth = 0;
  ctx.closePath();

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

  updateParticles(redCircles, isMousePressed, ovalWidth, ovalHeight);
  updateParticles(
    whiteCircles,
    isMousePressed,
    smallOvalWidth,
    smallOvalHeight
  );
  connectParticles(redCircles);
  connectParticles(whiteCircles);

  // Controlla se tutte le particelle sono fuori dallo schermo
  if (
    areAllParticlesOffScreen(redCircles) &&
    areAllParticlesOffScreen(whiteCircles)
  ) {
    finish();
  }
}

function areAllParticlesOffScreen(particles) {
  return particles.every(
    (particle) =>
      particle.x + particle.radius < 0 ||
      particle.x - particle.radius > canvas.width ||
      particle.y + particle.radius < 0 ||
      particle.y - particle.radius > canvas.height
  );
}

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
      particle.x = x;
      particle.y = y;
    } else if (moveToOval) {
      particle.x += (particle.targetX - particle.x) * 0.025;
      particle.y += (particle.targetY - particle.y) * 0.025;

      const distanceToTarget = Math.sqrt(
        (particle.x - particle.targetX) ** 2 +
          (particle.y - particle.targetY) ** 2
      );
      particle.onTarget = distanceToTarget < 5;
    } else {
      particle.x += particle.dx;
      particle.y += particle.dy;
      particle.onTarget = false;
    }

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, 2 * Math.PI);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.closePath();
  });
}

function calculateOvalPositions(particles, targetOvalWidth, targetOvalHeight) {
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  particles.forEach((particle, i) => {
    const angle = (i / particles.length) * 2 * Math.PI;
    particle.targetX = x + targetOvalWidth * Math.cos(angle);
    particle.targetY = y + targetOvalHeight * Math.sin(angle);
  });
}

//questo permette di connettere le particelle
function connectParticles(particles) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i];
      const p2 = particles[j];
      const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

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

  redCircles.forEach((particle) => {
    particle.dx *= 2.5;
    particle.dy *= 2.5;
  });

  whiteCircles.forEach((particle) => {
    particle.dx *= 2.5;
    particle.dy *= 2.5;
  });
});

function runCustom() {
  update();
  requestAnimationFrame(runCustom);
}

runCustom();
