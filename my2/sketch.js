import { createEngine } from "../../shared/engine.js";

const { renderer, input, run } = createEngine();
const { ctx, canvas } = renderer;

const particles = [];
const maxParticles = 2000;
const circleRadius = canvas.height / 4; // Il cerchio è metà dell'altezza del canvas

// Genera particelle inizialmente al centro
for (let i = 0; i < maxParticles; i++) {
  particles.push({
    x: canvas.width / 2, // Posizione iniziale al centro
    y: canvas.height / 2,
    scale: 0, // Particella inizialmente invisibile
    targetScale: 1, // Scala finale
    reachedTarget: false,
    angle: Math.random() * Math.PI * 2,
    distance: Math.random() * circleRadius,
    velocityX: 0,
    velocityY: 0,
  });
}

run(update);

function update(dt) {
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  const textSize = canvas.height / 2;

  const mouseX = input.getX();
  const mouseY = input.getY();
  const isMouseDown = input.isPressed();

  // Calcola il movimento e l'animazione delle particelle
  particles.forEach((particle) => {
    if (!particle.reachedTarget) {
      // Espansione iniziale verso la posizione target
      particle.scale += dt * 2; // Velocità di espansione
      if (particle.scale >= particle.targetScale) {
        particle.scale = particle.targetScale;
        particle.reachedTarget = true;
      }

      // Sposta la particella dalla posizione iniziale verso il target
      particle.x =
        x + Math.cos(particle.angle) * particle.distance * particle.scale;
      particle.y =
        y + Math.sin(particle.angle) * particle.distance * particle.scale;
    } else if (isMouseDown) {
      // Attirare particelle verso il mouse quando premuto
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const attractionSpeed = 1000; // Velocità di attrazione

      if (distance > 1) {
        particle.velocityX += (dx / distance) * attractionSpeed * dt;
        particle.velocityY += (dy / distance) * attractionSpeed * dt;
      }
    }
    particle.velocityX *= 0.99; // Riduzione graduale della velocità
    particle.velocityY *= 0.99;
    particle.x += particle.velocityX * dt;
    particle.y += particle.velocityY * dt;
  });

  // Disegna sfondo
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Disegna il cerchio
  ctx.beginPath();
  ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 5;
  ctx.stroke();

  // Disegna particelle
  particles.forEach((particle) => {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 10 * particle.scale, 0, Math.PI * 2); // Scala il raggio in base alla scala
    ctx.fill();
  });

  // Disegna il numero "2"
  ctx.fillStyle = "white";
  ctx.textBaseline = "middle";
  ctx.font = `${textSize}px Helvetica Neue, Helvetica, bold`;
  ctx.textAlign = "center";
  ctx.fillText("2", x, y);
}
