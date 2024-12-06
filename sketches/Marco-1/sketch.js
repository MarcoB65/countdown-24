import { createEngine } from "../../shared/engine.js";

const { renderer, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

//Struutra
const lineCount = 20;
const velocities = Array.from({ length: lineCount }, () => Math.random() * 15);
const horizontalOffsets = Array(lineCount).fill(0);
const verticalOffsets = Array(lineCount).fill(0);

//SOUND
const ambienceSound = await audio.load({
  src: "sound/Radio.wav",
  loop: true,
});

let ambienceSoundInst = null;

function calculateVolume(x, y, screenWidth, screenHeight) {
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  const distanceFromCenter = Math.sqrt(
    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
  );
  const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
  return Math.min(1, distanceFromCenter / maxDistance);
}

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
    const volume = calculateVolume(
      event.clientX,
      event.clientY,
      screenWidth,
      screenHeight
    );
    ambienceSoundInst.setVolume(volume);
    const pitch = calculateRandomPitch(1.0, 0.1);
    ambienceSoundInst.setPlaybackRate(pitch);
  }
}

document.addEventListener("mousedown", playSound);
document.addEventListener("mouseup", stopSound); //riguarda la logica però può funzionare x il sistema
document.addEventListener("mousemove", updateSound);

run(update);

let mouse = { x: canvas / 2, y: canvas / 2 };

function getDist() {
  return (
    Math.sqrt(
      (canvas.width / 4 - mouse.x) ** 2 + (canvas.height / 4 - mouse.y) ** 2
    ) * 0.4
  );
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
  const textTop = y - textHeight / 2;
  const lineHeight = textHeight / lineCount;

  for (let i = 0; i < lineCount; i++) {
    horizontalOffsets[i] = (Math.random() * 2 - 1) * getDist();
    verticalOffsets[i] = (Math.random() * 2 - 1) * getDist();
  }

  for (let i = 0; i < lineCount; i++) {
    const clipY = textTop + i * lineHeight;
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      x + horizontalOffsets[i] - textMetrics.actualBoundingBoxLeft,
      clipY,
      textMetrics.width,
      lineHeight
    );
    ctx.clip();
    ctx.fillStyle = "rgb(0, 255, 162)";
    ctx.fillText("1", x + horizontalOffsets[i], y);
    ctx.restore();
  }

  for (let i = 0; i < lineCount; i++) {
    const clipY = textTop + i * lineHeight + verticalOffsets[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      x - textMetrics.actualBoundingBoxLeft,
      clipY,
      textMetrics.width,
      lineHeight
    );
    ctx.clip();
    ctx.fillStyle = "white";
    ctx.fillText("1", x, y + verticalOffsets[i]);
    ctx.restore();
  }

  ctx.globalCompositeOperation = "multiply"; //non funziona ma prova a cambiare (non ncessario)!

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
