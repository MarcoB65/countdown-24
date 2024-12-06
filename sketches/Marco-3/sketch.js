import { createEngine } from "../../../shared/engine.js";

const { renderer, input, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

const gridSize = 5;
const squareSize = 100;
const spacing = 50;
let grid = [];
let pathIndex = 0;
let currentProgress = 0;
let pathComplete = false;
let introComplete = false;
let vibrationDirection = 10;
let scalingStarted = false;
let scalingPhase2Started = false;
let gridAnimationComplete = false;
let phase1Complete = false;

//SQUARE COORDINATES
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

function getRandomColor() {
  const colors = ["rgb(0, 255, 162)"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function initializeGrid() {
  const totalSize = gridSize * squareSize + (gridSize - 1) * spacing;
  const startX = (canvas.width - totalSize) / 2;
  const startY = (canvas.height - totalSize) / 2;

  grid = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = startX + col * (squareSize + spacing);
      const y = startY + row * (squareSize + spacing);
      grid.push({
        x,
        y,
        row,
        col,
        scale: 0,
        vibrating: false,
        vibrationOffset: { x: 0, y: 0 },
        vibrationTimer: 0,
        color: "white",
      });
    }
  }
}

function updateIntro() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const totalSize = gridSize * squareSize + (gridSize - 1) * spacing;
  const startX = (canvas.width - totalSize) / 2;
  const startY = (canvas.height - totalSize) / 2;

  const centerX = startX + 2 * (squareSize + spacing);
  const centerY = startY + 2 * (squareSize + spacing);

  ctx.fillStyle = "white";
  ctx.fillRect(
    centerX - squareSize / 2,
    centerY - squareSize / 2,
    squareSize,
    squareSize
  );

  if (input.isPressed()) {
    introComplete = true;
    initializeGrid();
  }
}

function animateGridAppearance() {
  let animationComplete = true;

  grid.forEach((square) => {
    if (square.scale < 1) {
      square.scale = Math.min(1, square.scale + 0.05);
      animationComplete = false;
    }
  });

  if (animationComplete) {
    gridAnimationComplete = true;
  }
}

function updateVibrations() {
  grid.forEach((square) => {
    if (square.vibrating) {
      square.vibrationOffset.x = (Math.random() - 0.5) * 10;
      square.vibrationOffset.y = (Math.random() - 0.5) * 10;

      square.vibrationTimer -= 1;
      if (square.vibrationTimer <= 0) {
        square.vibrating = false;
        square.vibrationOffset = { x: 0, y: 0 };
      }
    }
  });
}

const ambienceSound = await audio.load({
  src: "sound/Boing.wav",
  loop: false,
});
const ambienceSoundInst = ambienceSound.play();

const impactSound = await audio.load("sound/Boing.wav");

function triggerVibration(row, col) {
  const square = grid.find((s) => s.row === row && s.col === col);
  if (square && !square.vibrating) {
    square.vibrating = true;
    square.vibrationTimer = 10;

    const newColor = getRandomColor();
    if (
      newColor === "rgb(0, 255, 162)" &&
      square.color !== "rgb(0, 255, 162)"
    ) {
      //PLAYING SOUND ONLY IT'S PRESS!
      impactSound.play();
    }

    //UPDATE SQUARE COLO
    square.color = newColor;
  }
}

function drawPath() {
  if (scalingPhase2Started) return;

  ctx.strokeStyle = "rgb(0, 255, 162)";
  ctx.lineWidth = 100;

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
      //CHECK ENTRY OF THE SNAKE
      triggerVibration(startCoord[0], startCoord[1]);
    }

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
}

//
function update() {
  if (!introComplete) {
    updateIntro();
    return;
  }

  if (!gridAnimationComplete) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    grid.forEach(({ x, y, scale }) => {
      const size = squareSize * scale;
      ctx.fillRect(
        x + (squareSize - size) / 2,
        y + (squareSize - size) / 2,
        size,
        size
      );
    });

    animateGridAppearance();
    return;
  }

  updateVibrations();

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawPath();

  grid.forEach(({ x, y, scale, vibrationOffset, color }) => {
    if (scale > 0) {
      const size = squareSize * scale;

      ctx.fillStyle = color;

      ctx.fillRect(
        x + (squareSize - size) / 2 + vibrationOffset.x,
        y + (squareSize - size) / 2 + vibrationOffset.y,
        size,
        size
      );
    }
  });

  if (!pathComplete && input.isPressed()) {
    currentProgress += 0.05;

    if (currentProgress >= 1 && pathIndex < number3Path.length - 1) {
      currentProgress = 0;
      pathIndex++;
    }

    if (pathIndex === number3Path.length - 1 && currentProgress >= 1) {
      pathComplete = true;
      setTimeout(() => {
        scalingStarted = true;
      }, 1000);
    }
  }

  if (scalingStarted && !phase1Complete) {
    grid.forEach((square) => {
      const isInPath = number3Path.some(
        ([r, c]) => r === square.row && c === square.col
      );
      if (!isInPath) {
        square.scale = Math.max(0, square.scale - 0.02);
      }
    });

    const allNonPathScaledDown = grid.every(
      ({ row, col, scale }) =>
        scale <= 0 || number3Path.some(([r, c]) => r === row && c === col)
    );

    if (allNonPathScaledDown) {
      phase1Complete = true;
      setTimeout(() => {
        scalingPhase2Started = true;
      }, 1000);
    }
  }

  if (scalingPhase2Started) {
    grid.forEach((square) => {
      const isInPath = number3Path.some(
        ([r, c]) => r === square.row && c === square.col
      );
      if (isInPath) {
        square.scale = Math.max(0, square.scale - 0.02);
      }
    });

    const allScaledDown = grid.every(({ scale }) => scale <= 0);

    if (allScaledDown) {
      finish();
    }
  }
}
run(update);
