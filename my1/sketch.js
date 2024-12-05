import { createEngine } from "../shared/engine.js";

const { renderer, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

// Configurazioni
const lineCount = 20; // Numero di linee
const velocities = Array.from({ length: lineCount }, () => Math.random() * 15); // Velocità casuali per ogni linea (comune per movimenti orizzontali e verticali)
const horizontalOffsets = Array(lineCount).fill(0); // Offset orizzontale
const verticalOffsets = Array(lineCount).fill(0); // Offset verticale

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

  if (scale <= 0) {
    finish();
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
