import { createEngine } from "../../shared/engine.js";

const { renderer, input, run, finish } = createEngine();
const { ctx, canvas } = renderer;

const gridSize = 5;
const squareSize = 100;
const spacing = 50;
let grid = [];
let pathIndex = 0;
let currentProgress = 0;
let pathComplete = false;
let introComplete = false;
let vibrationOffset = 5;
let vibrationDirection = 10;
let scalingStarted = false; // Flag per avviare la scalatura dopo il ritardo

const number3Path = [
  [1, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 4],
  [2, 3],
  [2, 2],
  [2, 3],
  [3, 4],
  [4, 3],
  [4, 2],
  [4, 1],
  [3, 0],
];

function initializeGrid() {
  const totalSize = gridSize * squareSize + (gridSize - 1) * spacing;
  const startX = (canvas.width - totalSize) / 2;
  const startY = (canvas.height - totalSize) / 2;

  grid = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = startX + col * (squareSize + spacing);
      const y = startY + row * (squareSize + spacing);
      grid.push({ x, y, row, col, scale: 1 });
    }
  }
}

function updateIntro() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Disegna solo il quadratino centrale con vibrazione
  const totalSize = gridSize * squareSize + (gridSize - 1) * spacing;
  const startX = (canvas.width - totalSize) / 2;
  const startY = (canvas.height - totalSize) / 2;

  const centerX = startX + 2 * (squareSize + spacing);
  const centerY = startY + 2 * (squareSize + spacing);

  // Vibrazione del quadratino centrale
  if (Date.now() % 2000 > 1800) {
    vibrationOffset += 1 * vibrationDirection;
    if (vibrationOffset > 5 || vibrationOffset < -5) {
      vibrationDirection *= -1;
    }
  } else {
    vibrationOffset = 0;
  }

  ctx.fillStyle = "white";
  ctx.fillRect(
    centerX - squareSize / 2 + vibrationOffset,
    centerY - squareSize / 2,
    squareSize,
    squareSize
  );

  // Controllo clic sul quadratino
  if (input.isPressed()) {
    introComplete = true;
    initializeGrid(); // Crea la griglia
  }
}

run(update);

function update() {
  if (!introComplete) {
    updateIntro();
    return;
  }

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  grid.forEach(({ x, y, scale }) => {
    if (scale > 0) {
      const size = squareSize * scale;
      ctx.fillRect(
        x + (squareSize - size) / 2,
        y + (squareSize - size) / 2,
        size,
        size
      );
    }
  });

  ctx.strokeStyle = "white";
  ctx.lineWidth = 100;

  if (!pathComplete && input.isPressed()) {
    currentProgress += 0.05;

    if (currentProgress >= 1 && pathIndex < number3Path.length - 1) {
      currentProgress = 0;
      pathIndex++;
    }

    if (pathIndex === number3Path.length - 1 && currentProgress >= 1) {
      pathComplete = true;
      setTimeout(() => {
        scalingStarted = true; // Inizia la scalatura dopo 1 secondo
      }, 1000);
    }
  }

  if (scalingStarted) {
    grid.forEach((square) => {
      square.scale = Math.max(0, square.scale - 0.02); // Tutti i quadrati scompaiono gradualmente
    });
  }

  drawPath();

  // Controlla se tutti gli elementi sono stati scalati a 0
  const allScaledDown = grid.every(({ scale }) => scale <= 0);

  if (allScaledDown) {
    finish(); // Termina l'animazione
  }
}

function drawPath() {
  if (scalingStarted) return; // Non disegna il tracciato se la scalatura è iniziata

  ctx.beginPath();

  for (let i = 0; i <= pathIndex; i++) {
    const startCoord = number3Path[i];
    const endCoord = number3Path[i + 1] || startCoord;

    const startSquare = grid.find(
      (square) => square.row === startCoord[0] && square.col === startCoord[1]
    );
    const endSquare = grid.find(
      (square) => square.row === endCoord[0] && square.col === endCoord[1]
    );

    if (!startSquare || !endSquare) continue;

    const currentX =
      startSquare.x +
      squareSize / 2 +
      (endSquare.x - startSquare.x) * currentProgress;
    const currentY =
      startSquare.y +
      squareSize / 2 +
      (endSquare.y - startSquare.y) * currentProgress;

    if (i === pathIndex) {
      ctx.moveTo(
        startSquare.x + squareSize / 2,
        startSquare.y + squareSize / 2
      );
      ctx.lineTo(currentX, currentY);
    } else {
      ctx.moveTo(
        startSquare.x + squareSize / 2,
        startSquare.y + squareSize / 2
      );
      ctx.lineTo(endSquare.x + squareSize / 2, endSquare.y + squareSize / 2);
    }
  }

  ctx.stroke();
  if (scale <= 0) {
    finish();
  }
}
