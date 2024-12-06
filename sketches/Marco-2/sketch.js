import { createEngine } from "../../../shared/engine.js";

const { renderer, input, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

const particles = [];
const maxParticles = 20000;
const circleRadius = canvas.height / 4;
const mouseCircleRadius = 700;

//SOUND CHECKING!
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

let isAnimatingNumber = false;
let numberAnimationTimer = 0;
let numberY = canvas.height / 2;
let numberX = canvas.width / 2;
let numberVelocityX = 0;
let numberVelocityY = 0;

let initialScale = 0;
const scaleDuration = 1;
let elapsedTime = 0;

let numberOpacity = 0;
const opacityDuration = 6;

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
    color: Math.random() < 0.5 ? "white" : "rgb(0, 255, 162)", //MIXING COLORS IN THE PARTICLE!
  });
}
numberOpacity = 0;

run(update);

function update(dt) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const textSize = (canvas.height / 2) * initialScale;

  elapsedTime += dt;
  if (elapsedTime < scaleDuration) {
    initialScale = elapsedTime / scaleDuration;
  } else {
    initialScale = 1;
  }

  const mouseX = input.getX();
  const mouseY = input.getY();
  const isMouseDown = input.isPressed();

  const ovaleWidth = 100;
  const ovaleHeight = 180;

  if (particles.every((p) => p.scale >= 1)) numberOpacity = 1;

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

    //BOUNDING BOX!
    if (
      Math.abs(localX) < ovaleWidth / 2 &&
      Math.abs(localY) < ovaleHeight / 2
    ) {
      particles.splice(i, 1);
      continue;
    }
    //
    if (!particle.reachedTarget) {
      particle.scale += dt * 2 * initialScale;
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

  //dagli un occhiata per vedere cosa cambiare
  if (particles.length === 0 && !isAnimatingNumber) {
    isAnimatingNumber = true;
    numberAnimationTimer = 2;
    numberVelocityX = 0;
    numberVelocityY = -100;
  }

  if (isAnimatingNumber) {
    if (numberAnimationTimer > 0) {
      numberAnimationTimer -= dt;
      numberX += Math.sin(Date.now() * 0.05) * 5;
      numberY += Math.cos(Date.now() * 0.05) * 5;
    } else {
      numberVelocityY += 5000 * dt;
      numberX += numberVelocityX * dt;
      numberY += numberVelocityY * dt;

      if (numberY > canvas.height + textSize) {
        isAnimatingNumber = false;
        finish();
      }
    }
  }

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = numberOpacity;
  ctx.fillStyle = "white";
  ctx.textBaseline = "middle";
  ctx.font = `${textSize}px Helvetica Neue, Helvetica, bold`;
  ctx.textAlign = "center";

  if (!isAnimatingNumber) {
    ctx.fillText("2", centerX, centerY);
  } else {
    ctx.fillText("2", numberX, numberY);
  }
  ctx.globalAlpha = 1;

  particles.forEach((particle) => {
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(
      particle.x,
      particle.y,
      10 * particle.scale * particle.weight * initialScale,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });

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
