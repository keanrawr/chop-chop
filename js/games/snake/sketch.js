(function () {
  const canvas = document.getElementById("snake-game");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  const scoreValue = document.getElementById("snake-score");
  const speedValue = document.getElementById("snake-speed");
  const stateValue = document.getElementById("snake-state");
  const resetButton = document.getElementById("snake-reset");

  const cellSize = 25;
  const cols = canvas.width / cellSize;
  const rows = canvas.height / cellSize;
  const baseTickMs = 165;
  const minTickMs = 70;
  const speedStepMs = 10;
  const speedUpEvery = 3;

  let snake;
  let food;
  let score;
  let gameOver;
  let tickMs;
  let lastTickAt = 0;

  function randomFoodPosition() {
    const availableCells = [];

    for (let x = 0; x < cols; x += 1) {
      for (let y = 0; y < rows; y += 1) {
        if (!snake.occupiesCell(x, y)) {
          availableCells.push({ x, y });
        }
      }
    }

    return availableCells[Math.floor(Math.random() * availableCells.length)] || null;
  }

  function updateHud() {
    scoreValue.textContent = String(score);
    speedValue.textContent = `${Math.round(1000 / tickMs)} fps`;
    stateValue.textContent = gameOver ? "Perdiste" : "Jugando";
  }

  function resetGame() {
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);

    snake = new Snake(startX, startY);
    score = 0;
    gameOver = false;
    tickMs = baseTickMs;
    lastTickAt = 0;
    food = randomFoodPosition();
    updateHud();
  }

  function increaseDifficulty() {
    const boosts = Math.floor(score / speedUpEvery);
    tickMs = Math.max(minTickMs, baseTickMs - boosts * speedStepMs);
  }

  function drawCell(x, y, fillStyle, inset = 0) {
    const padding = inset * cellSize;
    context.fillStyle = fillStyle;
    context.fillRect(
      x * cellSize + padding,
      y * cellSize + padding,
      cellSize - padding * 2,
      cellSize - padding * 2
    );
  }

  function drawBoard() {
    context.fillStyle = "#07101f";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "rgba(255,255,255,0.05)";
    context.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += cellSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }

    for (let y = 0; y <= canvas.height; y += cellSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
  }

  function drawSnake() {
    snake.segments.forEach((segment, index) => {
      const isHead = index === snake.segments.length - 1;
      drawCell(segment.x, segment.y, isHead ? "#9ef01a" : "#70e000", 0.08);
    });
  }

  function drawFood() {
    if (!food) {
      return;
    }

    drawCell(food.x, food.y, "#ff6b6b", 0.16);
  }

  function drawGameOver() {
    if (!gameOver) {
      return;
    }

    context.fillStyle = "rgba(7, 16, 31, 0.72)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.font = "bold 32px Arial";
    context.fillText("Fin del juego", canvas.width / 2, canvas.height / 2 - 10);
    context.font = "18px Arial";
    context.fillText("Presiona R o usa Reiniciar", canvas.width / 2, canvas.height / 2 + 24);
  }

  function tick() {
    if (gameOver) {
      return;
    }

    const nextHead = snake.getNextHead();
    const ateFood = food && nextHead.x === food.x && nextHead.y === food.y;

    snake.move(ateFood);

    if (snake.hitsWall(cols, rows) || snake.hitsSelf()) {
      gameOver = true;
      updateHud();
      return;
    }

    if (ateFood) {
      score += 1;
      increaseDifficulty();
      food = randomFoodPosition();
    }

    updateHud();
  }

  function render() {
    drawBoard();
    drawFood();
    drawSnake();
    drawGameOver();
  }

  function loop(timestamp) {
    if (!lastTickAt) {
      lastTickAt = timestamp;
    }

    if (!gameOver && timestamp - lastTickAt >= tickMs) {
      lastTickAt = timestamp;
      tick();
    }

    render();
    window.requestAnimationFrame(loop);
  }

  const directionByKey = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }
  };

  document.addEventListener("keydown", (event) => {
    if (directionByKey[event.key]) {
      event.preventDefault();
      snake.setDirection(directionByKey[event.key]);
      return;
    }

    if (event.key === "r" || event.key === "R") {
      event.preventDefault();
      resetGame();
    }
  });

  resetButton.addEventListener("click", resetGame);

  resetGame();
  window.requestAnimationFrame(loop);
})();
