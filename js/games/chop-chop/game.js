(function () {
  const canvas = document.getElementById("bunny-run-game");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  const scoreValue = document.getElementById("bunny-score");
  const speedValue = document.getElementById("bunny-speed");
  const stateValue = document.getElementById("bunny-state");
  const resetButton = document.getElementById("bunny-reset");

  const gravity = 1600;
  const baseSpeed = 300;
  let game;

  function createGame() {
    return {
      bunny: {
        x: 90,
        y: 0,
        width: 52,
        height: 52,
        velocityY: 0,
        jumpForce: 620
      },
      groundY: canvas.height - 88,
      obstacles: [],
      spawnTimer: 0,
      score: 0,
      distance: 0,
      speed: baseSpeed,
      state: "Corriendo"
    };
  }

  function resetGame() {
    game = createGame();
    game.bunny.y = game.groundY - game.bunny.height;
    updateHud();
  }

  function updateHud() {
    scoreValue.textContent = Math.floor(game.score).toString();
    speedValue.textContent = `${Math.round(game.speed)}`;
    stateValue.textContent = game.state;
  }

  function isOnGround() {
    return game.bunny.y >= game.groundY - game.bunny.height - 0.5;
  }

  function jump() {
    if (game.state !== "Corriendo" || !isOnGround()) {
      return;
    }

    game.bunny.velocityY = -game.bunny.jumpForce;
  }

  function spawnObstacle() {
    const tall = Math.random() > 0.7;
    game.obstacles.push({
      x: canvas.width + 40,
      y: game.groundY - (tall ? 72 : 48),
      width: tall ? 26 : 38,
      height: tall ? 72 : 48,
      tall
    });
  }

  function intersects(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function update(deltaSeconds) {
    if (game.state !== "Corriendo") {
      return;
    }

    game.speed = baseSpeed + Math.min(210, game.distance / 8);
    game.score += deltaSeconds * 12;
    game.distance += deltaSeconds * game.speed;
    game.spawnTimer -= deltaSeconds;

    if (game.spawnTimer <= 0) {
      spawnObstacle();
      game.spawnTimer = 0.95 - Math.min(0.45, game.distance / 7000) + Math.random() * 0.45;
    }

    game.bunny.velocityY += gravity * deltaSeconds;
    game.bunny.y += game.bunny.velocityY * deltaSeconds;

    if (game.bunny.y > game.groundY - game.bunny.height) {
      game.bunny.y = game.groundY - game.bunny.height;
      game.bunny.velocityY = 0;
    }

    game.obstacles.forEach((obstacle) => {
      obstacle.x -= game.speed * deltaSeconds;
    });
    game.obstacles = game.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -20);

    if (game.obstacles.some((obstacle) => intersects(game.bunny, obstacle))) {
      game.state = "Atrapado";
    }

    updateHud();
  }

  function drawBackground() {
    const sky = context.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#9bf6ff");
    sky.addColorStop(0.55, "#caffbf");
    sky.addColorStop(1, "#fefae0");
    context.fillStyle = sky;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "rgba(255, 255, 255, 0.65)";
    context.beginPath();
    context.arc(100, 88, 32, 0, Math.PI * 2);
    context.arc(126, 88, 24, 0, Math.PI * 2);
    context.arc(74, 88, 24, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#90be6d";
    context.fillRect(0, game.groundY, canvas.width, canvas.height - game.groundY);
    context.fillStyle = "#6a994e";
    context.fillRect(0, game.groundY + 28, canvas.width, 18);

    context.strokeStyle = "rgba(63, 102, 42, 0.18)";
    context.lineWidth = 2;
    for (let index = 0; index < canvas.width; index += 36) {
      const offset = (game.distance * 0.35 + index) % 36;
      context.beginPath();
      context.moveTo(index - offset, game.groundY + 20);
      context.lineTo(index + 12 - offset, game.groundY + 8);
      context.stroke();
    }
  }

  function drawBunny() {
    const { bunny } = game;

    context.fillStyle = "#ffffff";
    context.fillRect(bunny.x + 12, bunny.y + 18, 28, 26);
    context.fillRect(bunny.x + 18, bunny.y + 4, 8, 22);
    context.fillRect(bunny.x + 30, bunny.y + 2, 8, 24);
    context.fillRect(bunny.x + 34, bunny.y + 14, 14, 14);

    context.fillStyle = "#ffafcc";
    context.fillRect(bunny.x + 20, bunny.y + 8, 4, 12);
    context.fillRect(bunny.x + 32, bunny.y + 6, 4, 14);

    context.fillStyle = "#222";
    context.fillRect(bunny.x + 40, bunny.y + 18, 4, 4);
    context.fillRect(bunny.x + 46, bunny.y + 22, 3, 3);

    context.fillStyle = "#f28482";
    context.fillRect(bunny.x + 20, bunny.y + 44, 8, 6);
    context.fillRect(bunny.x + 34, bunny.y + 44, 8, 6);
  }

  function drawObstacles() {
    game.obstacles.forEach((obstacle) => {
      if (obstacle.tall) {
        context.fillStyle = "#4d7c0f";
        context.fillRect(obstacle.x + 8, obstacle.y, 10, obstacle.height);
        context.beginPath();
        context.arc(obstacle.x + 13, obstacle.y + 8, 18, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillStyle = "#8d6e63";
        context.fillRect(obstacle.x, obstacle.y + 22, obstacle.width, obstacle.height - 22);
        context.fillStyle = "#6d4c41";
        context.fillRect(obstacle.x + 4, obstacle.y + 12, obstacle.width - 8, 14);
      }
    });
  }

  function drawOverlay() {
    if (game.state === "Corriendo") {
      return;
    }

    context.fillStyle = "rgba(20, 33, 61, 0.34)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#14213d";
    context.textAlign = "center";
    context.font = "bold 30px Arial";
    context.fillText("Conejito frenado", canvas.width / 2, canvas.height / 2 - 10);
    context.font = "18px Arial";
    context.fillText("Presiona espacio, flecha arriba o R", canvas.width / 2, canvas.height / 2 + 24);
  }

  function render() {
    drawBackground();
    drawObstacles();
    drawBunny();
    drawOverlay();
  }

  let previousTime = 0;
  function loop(timestamp) {
    if (!previousTime) {
      previousTime = timestamp;
    }

    const deltaSeconds = Math.min(0.032, (timestamp - previousTime) / 1000);
    previousTime = timestamp;

    update(deltaSeconds);
    render();
    window.requestAnimationFrame(loop);
  }

  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
      event.preventDefault();
      jump();
    }

    if (event.key === "r" || event.key === "R") {
      resetGame();
    }
  });

  resetButton.addEventListener("click", resetGame);

  resetGame();
  window.requestAnimationFrame(loop);
})();
