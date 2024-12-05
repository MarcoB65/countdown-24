import { createEngine } from "../../shared/engine.js";

const { renderer, input, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

const particles = [];
const maxParticles = 7000;
const circleRadius = canvas.height / 4;
const mouseCircleRadius = 700;

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
    ambienceSoundInst.setVolume(0);
    ambienceSoundInst = null;
  }
}

document.addEventListener("mousedown", playSound);
document.addEventListener("mouseup", stopSound);

// Variabili per il numero "2"
let number = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  scale: 1,
  velocityX: 0,
  velocityY: 0,
  isAttracted: false,
  isDeleted: false,
  rotation: 0,
};

// Timer per il ritardo
let isTimerStarted = false;
let timer = 0;

// CREATE PARTICLES ON THE CENTER POINT
for (let i = 0; i < maxParticles; i++) {
  particles.push({
    x: canvas.width / 2,
    y: canvas.height / 2,
    scale: 0,
    targetScale: 1,
    reachedTarget: false,
    angle: Math.random() * Math.PI * 2,
    distance: Math.sqrt(Math.random()) * circleRadius,
    velocityX: 0,
    velocityY: 0,
    weight: Math.random() * 2,
  });
}

run(update);

function update(dt) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const textSize = canvas.height / 2;

  const mouseX = input.getX();
  const mouseY = input.getY();
  const isMouseDown = input.isPressed();

  const ovaleWidth = 100;
  const ovaleHeight = 180;

  // DELETE PARTICLES
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];

    const dxOval = centerX - mouseX;
    const dyOval = centerY - mouseY;
    const angle = Math.atan2(dyOval, dxOval);

    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const dx = particle.x - mouseX;
    const dy = particle.y - mouseY;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    if (
      Math.abs(localX) < ovaleWidth / 2 &&
      Math.abs(localY) < ovaleHeight / 2
    ) {
      particles.splice(i, 1);
      continue;
    }

    if (!particle.reachedTarget) {
      particle.scale += dt * 2;
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
        const attractionSpeed = 2000;
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

    particle.velocityX *= 0.99;
    particle.velocityY *= 0.99;
    particle.x += particle.velocityX * dt;
    particle.y += particle.velocityY * dt;
  }

  // TIMER PER IL NUMERO "2"
  if (particles.length === 0 && !number.isDeleted) {
    if (!isTimerStarted) {
      isTimerStarted = true;
      timer = 2; // 2 secondi di ritardo
    }

    if (timer > 0) {
      timer -= dt; // Riduci il timer
    } else {
      number.isAttracted = true;
    }
  }

  // GESTIONE NUMERO "2"
  if (number.isAttracted) {
    const dx = mouseX - number.x;
    const dy = mouseY - number.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calcola l'angolo di orientamento rispetto all'ellisse
    const angle = Math.atan2(dy, dx);
    number.rotation = angle;

    if (distance > 1) {
      const attractionSpeed = 500;
      number.velocityX += (dx / distance) * attractionSpeed * dt;
      number.velocityY += (dy / distance) * attractionSpeed * dt;
    }

    number.velocityX *= 0.99;
    number.velocityY *= 0.99;
    number.x += number.velocityX * dt;
    number.y += number.velocityY * dt;

    const distToOvalCenter = Math.sqrt(
      (number.x - mouseX) ** 2 + (number.y - mouseY) ** 2
    );

    if (distToOvalCenter < ovaleWidth / 2) {
      number.scale -= dt;
      if (number.scale <= 0) {
        number.scale = 0;
        number.isDeleted = true;
        finish();
      }
    }
  }

  // BACKGROUND
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // PARTICLES
  particles.forEach((particle) => {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(
      particle.x,
      particle.y,
      10 * particle.scale * particle.weight,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });

  // "2"
  if (!number.isDeleted) {
    ctx.save();
    ctx.translate(number.x, number.y);
    ctx.rotate(number.rotation);
    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    ctx.font = `${textSize * number.scale}px Helvetica Neue, Helvetica, bold`;
    ctx.textAlign = "center";
    ctx.fillText("2", 0, 0);
    ctx.restore();
  }

  // VACUUM
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
