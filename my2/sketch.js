import { createEngine } from "../../shared/engine.js";

const { renderer, input, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

const particles = [];
const maxParticles = 7000;
const circleRadius = canvas.height / 4; // Il cerchio è metà dell'altezza del canvas
const mouseCircleRadius = 700; // Raggio del cerchio che segue il mouse

const ambienceSound = await audio.load({
  src: "sound/Sound_vacum.wav",
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

// Variabili per gestire l'animazione del numero "2"
let isAnimatingNumber = false;
let numberAnimationTimer = 0;
let numberY = canvas.height / 2; // Altezza iniziale del numero
let numberX = canvas.width / 2; // Larghezza iniziale del numero
let numberVelocityX = 0; // Velocità orizzontale del numero
let numberVelocityY = 0; // Velocità verticale del numero

// Variabili per scalatura iniziale
let initialScale = 0; // Scala iniziale
const scaleDuration = 1; // Durata della scalatura iniziale in secondi
let elapsedTime = 0; // Tempo trascorso dall'inizio

// Variabili per opacità del numero
let numberOpacity = 0; // Opacità iniziale
const opacityDuration = 6; // Durata della transizione dell'opacità in secondi

// CREA PARTICELLE AL PUNTO CENTRALE
for (let i = 0; i < maxParticles; i++) {
  particles.push({
    x: canvas.width / 2, // Posizione iniziale al centro
    y: canvas.height / 2,
    scale: 0, // Particella inizialmente invisibile
    targetScale: 1, // Scala finale
    reachedTarget: false,
    angle: Math.random() * Math.PI * 2,
    distance: Math.sqrt(Math.random()) * circleRadius,
    velocityX: 0,
    velocityY: 0,
    weight: Math.random() * 2,
    color: Math.random() < 0.5 ? "white" : "rgb(0, 255, 162)", // 50% bianco, 50% rosso
  });
}
numberOpacity = 0;

run(update);

function update(dt) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const textSize = (canvas.height / 2) * initialScale; // Scala il testo in base alla scala iniziale

  // Gestione della scalatura iniziale
  elapsedTime += dt;
  if (elapsedTime < scaleDuration) {
    initialScale = elapsedTime / scaleDuration; // Scala progressivamente da 0 a 1
  } else {
    initialScale = 1; // Mantieni la scala a 1 dopo la durata
  }

  const mouseX = input.getX();
  const mouseY = input.getY();
  const isMouseDown = input.isPressed();

  const ovaleWidth = 100; // Larghezza dell'ovale
  const ovaleHeight = 180; // Altezza dell'ovale

  if (particles.every((p) => p.scale >= 1)) numberOpacity = 1;

  // Elimina particelle
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];

    // Direzione del buco
    const dxOval = centerX - mouseX;
    const dyOval = centerY - mouseY;
    const angle = Math.atan2(dyOval, dxOval);

    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const dx = particle.x - mouseX;
    const dy = particle.y - mouseY;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // Bounding box per eliminare le particelle
    if (
      Math.abs(localX) < ovaleWidth / 2 &&
      Math.abs(localY) < ovaleHeight / 2
    ) {
      particles.splice(i, 1);
      continue;
    }

    if (!particle.reachedTarget) {
      particle.scale += dt * 2 * initialScale; // Aggiungi scala iniziale
      if (particle.scale >= particle.targetScale) {
        particle.scale = particle.targetScale;
        particle.reachedTarget = true;
      }
      particle.x = centerX + Math.cos(particle.angle) * particle.distance;
      particle.y = centerY + Math.sin(particle.angle) * particle.distance;
    } else if (isMouseDown) {
      const dxMouse = mouseX - particle.x;
      const dyMouse = mouseY - particle.y;
      const distance = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

      if (distance < mouseCircleRadius) {
        const attractionSpeed = 2000; // Velocità di attrazione
        particle.velocityX += (dxMouse / distance) * attractionSpeed * dt;
        particle.velocityY += (dyMouse / distance) * attractionSpeed * dt;

        const distToOvalCenter = Math.sqrt(
          (particle.x - mouseX) ** 2 + (particle.y - mouseY) ** 2
        );

        const maxDistance = mouseCircleRadius;
        particle.scale = Math.max(0, distToOvalCenter / maxDistance);

        if (particle.scale <= 0) {
          particles.splice(i, 1);
          continue;
        }
      }
    }

    particle.velocityX *= 0.99; // Riduzione graduale della velocità
    particle.velocityY *= 0.99;
    particle.x += particle.velocityX * dt;
    particle.y += particle.velocityY * dt;
  }

  // Controlla se tutte le particelle sono state eliminate
  if (particles.length === 0 && !isAnimatingNumber) {
    isAnimatingNumber = true;
    numberAnimationTimer = 2; // Durata dell'animazione in secondi
    numberVelocityX = 0; // Impulso iniziale orizzontale per il numero
    numberVelocityY = -100; // Impulso iniziale verticale per il numero
  }

  if (isAnimatingNumber) {
    if (numberAnimationTimer > 0) {
      numberAnimationTimer -= dt;

      // Ballare: oscillazione
      numberX += Math.sin(Date.now() * 0.05) * 5;
      numberY += Math.cos(Date.now() * 0.05) * 5;
    } else {
      // Cadere fuori dal canvas
      numberVelocityY += 5000 * dt; // Gravità
      numberX += numberVelocityX * dt;
      numberY += numberVelocityY * dt;

      // Se il numero è fuori dal canvas, ferma l'animazione
      if (numberY > canvas.height + textSize) {
        isAnimatingNumber = false;
        finish();
      }
    }
  }

  // Sfondo
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Disegna il numero "2" PRIMA delle particelle
  ctx.globalAlpha = numberOpacity; // Imposta l'opacità del numero
  ctx.fillStyle = "white";
  ctx.textBaseline = "middle";
  ctx.font = `${textSize}px Helvetica Neue, Helvetica, bold`;
  ctx.textAlign = "center";

  if (!isAnimatingNumber) {
    ctx.fillText("2", centerX, centerY);
  } else {
    ctx.fillText("2", numberX, numberY);
  }
  ctx.globalAlpha = 1; // Ripristina l'opacità per altri elementi

  // Disegna particelle DOPO il numero
  particles.forEach((particle) => {
    ctx.fillStyle = particle.color; // Usa il colore della particella
    ctx.beginPath();
    ctx.arc(
      particle.x,
      particle.y,
      10 * particle.scale * particle.weight * initialScale, // Scala anche le particelle
      0,
      Math.PI * 2
    );
    ctx.fill();
  });

  // Disegna il buco aspiratore
  const dx = centerX - mouseX;
  const dy = centerY - mouseY;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(mouseX, mouseY);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.ellipse(0, 0, ovaleWidth, ovaleHeight, 0, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "white";
  ctx.stroke();
  ctx.restore();
}
