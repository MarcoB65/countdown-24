import { createEngine } from "../shared/engine.js";

const { renderer, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

// Configurazioni
const lineCount = 20; // Numero di linee
const velocities = Array.from({ length: lineCount }, () => Math.random() * 15); // Velocità casuali per ogni linea (comune per movimenti orizzontali e verticali)
const horizontalOffsets = Array(lineCount).fill(0); // Offset orizzontale
const verticalOffsets = Array(lineCount).fill(0); // Offset verticale

const ambienceSound = await audio.load({
  src: "sound/Radio.wav",
  loop: true,
});

let ambienceSoundInst = null;

// Funzione per calcolare il volume in base alla posizione del mouse
function calculateVolume(x, y, screenWidth, screenHeight) {
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;

  // Calcola la distanza del cursore dal centro
  const distanceFromCenter = Math.sqrt(
    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
  );

  // Calcola la distanza massima possibile (angolo dello schermo)
  const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));

  // Normalizza la distanza in un range da 0 a 1
  return Math.min(1, distanceFromCenter / maxDistance);
}

// Funzione per calcolare il pitch casuale
function calculateRandomPitch(basePitch, variation) {
  return basePitch + (Math.random() * variation - variation / 2);
}

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

function updateSound(event) {
  if (ambienceSoundInst) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calcola il volume basandosi sulla posizione del mouse
    const volume = calculateVolume(
      event.clientX,
      event.clientY,
      screenWidth,
      screenHeight
    );
    ambienceSoundInst.setVolume(volume);

    // Calcola il pitch con una variazione casuale
    const pitch = calculateRandomPitch(1.0, 0.1); // Pitch base è 1.0 con variazione di ±0.25
    ambienceSoundInst.setPlaybackRate(pitch); // Modifica la velocità di riproduzione
  }
}

document.addEventListener("mousedown", playSound);
document.addEventListener("mouseup", stopSound);
document.addEventListener("mousemove", updateSound);

run(update);

let mouse = { x: canvas / 2, y: canvas / 2 };
function getDist() {
  let d = Math.sqrt(
    (canvas.width / 4 - mouse.x) * (canvas.width / 4 - mouse.x) +
      (canvas.height / 4 - mouse.y) * (canvas.height / 4 - mouse.y)
  );
  return d * 0.4;
}

function update() {
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  const fontSize = canvas.height * 0.6;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textBaseline = "middle";
  ctx.font = `${fontSize}px Helvetica Neue, Helvetica, bold`;
  ctx.textAlign = "center";

  const textMetrics = ctx.measureText("1");
  const textHeight =
    textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
  const textTop = y - textHeight / 2; // Parte superiore del numero
  const lineHeight = textHeight / lineCount; // Altezza di ciascuna linea del numero

  //UPDATE POSIION
  for (let i = 0; i < lineCount; i++) {
    horizontalOffsets[i] = (Math.random() * 2 - 1) * getDist();
    verticalOffsets[i] = (Math.random() * 2 - 1) * getDist();

    // // CHANGE DIRECTIONS
    // if (horizontalOffsets[i] > 100 || horizontalOffsets[i] < -100) {
    //   velocities[i] *= -1;
    // }

    // if (verticalOffsets[i] > 50 || verticalOffsets[i] < -50) {
    //   velocities[i] *= -1;
    // }
  }
  console.log(getDist());

  // 1.1
  for (let i = 0; i < lineCount; i++) {
    const clipY = textTop + i * lineHeight; // Posizione verticale della linea
    ctx.save(); // Salva il contesto
    ctx.beginPath();
    ctx.rect(
      x + horizontalOffsets[i] - textMetrics.actualBoundingBoxLeft,
      clipY,
      textMetrics.width,
      lineHeight
    ); // Clipping ristretto al numero "1"
    ctx.clip(); // Applica il clipping
    ctx.fillStyle = "white";
    ctx.fillText("1", x + horizontalOffsets[i], y); // Disegna il numero con offset orizzontale
    ctx.restore(); // Ripristina il contesto
  }

  // 1.2
  for (let i = 0; i < lineCount; i++) {
    const clipY = textTop + i * lineHeight + verticalOffsets[i]; // Posizione verticale con offset
    ctx.save(); // Salva il contesto
    ctx.beginPath();
    ctx.rect(
      x - textMetrics.actualBoundingBoxLeft,
      clipY,
      textMetrics.width,
      lineHeight
    ); // Clipping ristretto al numero "1"
    ctx.clip(); // Applica il clipping
    ctx.fillStyle = "white"; // Cambia colore per distinguere il secondo numero
    ctx.fillText("1", x, y + verticalOffsets[i]); // Disegna il numero con offset verticale
    ctx.restore(); // Ripristina il contesto
  }

  ctx.globalCompositeOperation = "xor";

  // if (scale <= 0) {
  //   finish();
  // }

  if (getDist() < 10) {
    setTimeout(finish, 5000);
  }
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
