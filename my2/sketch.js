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
    // ambienceSoundInst.stop();
    ambienceSoundInst.setVolume(0);
    ambienceSoundInst = null;
  }
}

document.addEventListener("mousedown", playSound);
document.addEventListener("mouseup", stopSound);

// CREATE PARTICLES ON THE CENTER POINT
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

  const ovaleWidth = 100; // Larghezza dell'ovale
  const ovaleHeight = 180; // Altezza dell'ovale

  // DELETE PARTICLES1
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];

    // HOLE DIRECTION
    const dxOval = centerX - mouseX;
    const dyOval = centerY - mouseY;
    const angle = Math.atan2(dyOval, dxOval);

    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const dx = particle.x - mouseX;
    const dy = particle.y - mouseY;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    //BOUNDING BOX!

    if (
      Math.abs(localX) < ovaleWidth / 2 &&
      Math.abs(localY) < ovaleHeight / 2
    ) {
      // delete particles
      particles.splice(i, 1);
      continue;
    }

    //
    //
    //

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
        const attractionSpeed = 2000; // Velocità di attrazione
        particle.velocityX += (dxMouse / distance) * attractionSpeed * dt;
        particle.velocityY += (dyMouse / distance) * attractionSpeed * dt;

        // SCALING
        const distToOvalCenter = Math.sqrt(
          (particle.x - mouseX) ** 2 + (particle.y - mouseY) ** 2
        );

        const maxDistance = mouseCircleRadius;
        particle.scale = Math.max(0, distToOvalCenter / maxDistance);

        // DELETE IF SCALE IS 0
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

  // BACKGROUND
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // // CERCLE
  // ctx.beginPath();
  // ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
  // ctx.strokeStyle = "white";
  // ctx.lineWidth = 5;
  // ctx.stroke();

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
  ctx.fillStyle = "white";
  ctx.textBaseline = "middle";
  ctx.font = `${textSize}px Helvetica Neue, Helvetica, bold`;
  ctx.textAlign = "center";
  ctx.fillText("2", centerX, centerY);

  const dx = centerX - mouseX;
  const dy = centerY - mouseY;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(mouseX, mouseY);
  ctx.rotate(angle);

  //VACUUM
  ctx.beginPath();
  ctx.ellipse(0, 0, ovaleWidth, ovaleHeight, 0, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "white";
  ctx.stroke();
  ctx.restore();

  if (scale <= 0) {
    finish();
  }
}
