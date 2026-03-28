(function () {
  const canvas = document.getElementById("space-invaders-game");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  const scoreValue = document.getElementById("space-score");
  const waveValue = document.getElementById("space-wave");
  const stateValue = document.getElementById("space-state");
  const resetButton = document.getElementById("space-reset");

  const keys = new Set();
  let game;

  function createGame() {
    return {
      player: { x: canvas.width / 2 - 22, y: canvas.height - 38, width: 44, height: 18, speed: 280 },
      bullets: [],
      alienBullets: [],
      invaders: [],
      direction: 1,
      moveTimer: 0,
      moveInterval: 0.75,
      shootCooldown: 0,
      alienShootTimer: 0,
      score: 0,
      wave: 1,
      state: "Jugando"
    };
  }

  function spawnWave() {
    game.invaders = [];

    const rows = 3 + Math.min(2, game.wave - 1);
    const cols = 8;
    const offsetX = 86;
    const offsetY = 64;
    const gapX = 58;
    const gapY = 40;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        game.invaders.push({
          x: offsetX + col * gapX,
          y: offsetY + row * gapY,
          width: 30,
          height: 20,
          alive: true,
          row
        });
      }
    }

    game.direction = 1;
    game.moveInterval = Math.max(0.18, 0.75 - (game.wave - 1) * 0.08);
    game.moveTimer = 0;
    game.alienBullets = [];
  }

  function resetGame() {
    game = createGame();
    spawnWave();
    updateHud();
  }

  function updateHud() {
    scoreValue.textContent = String(game.score);
    waveValue.textContent = String(game.wave);
    stateValue.textContent = game.state;
  }

  function setGameState(nextState) {
    game.state = nextState;
    updateHud();
  }

  function intersects(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function shootPlayerBullet() {
    if (game.shootCooldown > 0 || game.state !== "Jugando") {
      return;
    }

    game.bullets.push({
      x: game.player.x + game.player.width / 2 - 2,
      y: game.player.y - 10,
      width: 4,
      height: 12,
      speed: 360
    });
    game.shootCooldown = 0.25;
  }

  function moveInvaders() {
    const aliveInvaders = game.invaders.filter((invader) => invader.alive);
    if (!aliveInvaders.length) {
      game.wave += 1;
      spawnWave();
      updateHud();
      return;
    }

    const stepX = 18 * game.direction;
    const edgeReached = aliveInvaders.some((invader) => {
      const nextX = invader.x + stepX;
      return nextX < 16 || nextX + invader.width > canvas.width - 16;
    });

    if (edgeReached) {
      game.direction *= -1;
      aliveInvaders.forEach((invader) => {
        invader.y += 18;
      });
    } else {
      aliveInvaders.forEach((invader) => {
        invader.x += stepX;
      });
    }

    if (aliveInvaders.some((invader) => invader.y + invader.height >= game.player.y)) {
      setGameState("Perdiste");
    }
  }

  function alienShoot() {
    const livingInvaders = game.invaders.filter((invader) => invader.alive);
    if (!livingInvaders.length || game.state !== "Jugando") {
      return;
    }

    const columns = new Map();
    livingInvaders.forEach((invader) => {
      const columnKey = Math.round(invader.x);
      const current = columns.get(columnKey);
      if (!current || invader.y > current.y) {
        columns.set(columnKey, invader);
      }
    });

    const shooters = Array.from(columns.values());
    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    game.alienBullets.push({
      x: shooter.x + shooter.width / 2 - 2,
      y: shooter.y + shooter.height + 6,
      width: 4,
      height: 12,
      speed: 220 + game.wave * 18
    });
  }

  function update(deltaSeconds) {
    if (game.state !== "Jugando") {
      return;
    }

    const { player } = game;
    if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) {
      player.x -= player.speed * deltaSeconds;
    }
    if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) {
      player.x += player.speed * deltaSeconds;
    }

    player.x = Math.max(12, Math.min(canvas.width - player.width - 12, player.x));

    game.shootCooldown = Math.max(0, game.shootCooldown - deltaSeconds);
    game.moveTimer += deltaSeconds;
    game.alienShootTimer += deltaSeconds;

    if (game.moveTimer >= game.moveInterval) {
      game.moveTimer = 0;
      moveInvaders();
    }

    if (game.alienShootTimer >= Math.max(0.4, 1.1 - game.wave * 0.08)) {
      game.alienShootTimer = 0;
      alienShoot();
    }

    game.bullets.forEach((bullet) => {
      bullet.y -= bullet.speed * deltaSeconds;
    });
    game.alienBullets.forEach((bullet) => {
      bullet.y += bullet.speed * deltaSeconds;
    });

    game.bullets = game.bullets.filter((bullet) => bullet.y + bullet.height > 0);
    game.alienBullets = game.alienBullets.filter((bullet) => bullet.y < canvas.height);

    game.bullets.forEach((bullet) => {
      game.invaders.forEach((invader) => {
        if (!invader.alive || bullet.hit) {
          return;
        }
        if (intersects(bullet, invader)) {
          bullet.hit = true;
          invader.alive = false;
          game.score += 10 + (2 - invader.row) * 5;
        }
      });
    });

    game.bullets = game.bullets.filter((bullet) => !bullet.hit);

    game.alienBullets.forEach((bullet) => {
      if (intersects(bullet, player)) {
        bullet.hit = true;
        setGameState("Perdiste");
      }
    });
    game.alienBullets = game.alienBullets.filter((bullet) => !bullet.hit);

    if (game.invaders.every((invader) => !invader.alive)) {
      game.wave += 1;
      spawnWave();
    }

    updateHud();
  }

  function drawBackground() {
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#030711");
    gradient.addColorStop(1, "#101f41");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (let index = 0; index < 50; index += 1) {
      const x = (index * 97) % canvas.width;
      const y = (index * 53) % canvas.height;
      context.fillRect(x, y, 2, 2);
    }
  }

  function drawPlayer() {
    const { player } = game;
    context.fillStyle = "#7ae582";
    context.beginPath();
    context.moveTo(player.x, player.y + player.height);
    context.lineTo(player.x + player.width / 2, player.y);
    context.lineTo(player.x + player.width, player.y + player.height);
    context.closePath();
    context.fill();
    context.fillRect(player.x + player.width / 2 - 5, player.y + 2, 10, 10);
  }

  function drawInvaders() {
    game.invaders.forEach((invader) => {
      if (!invader.alive) {
        return;
      }

      context.fillStyle = ["#ff6b6b", "#ffd166", "#70e000"][invader.row % 3];
      context.fillRect(invader.x, invader.y, invader.width, invader.height);
      context.clearRect(invader.x + 6, invader.y + 6, 4, 4);
      context.clearRect(invader.x + 20, invader.y + 6, 4, 4);
      context.fillStyle = "#030711";
      context.fillRect(invader.x + 8, invader.y + 14, 4, 4);
      context.fillRect(invader.x + 18, invader.y + 14, 4, 4);
    });
  }

  function drawBullets() {
    context.fillStyle = "#f8f9fa";
    game.bullets.forEach((bullet) => {
      context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    context.fillStyle = "#ff8fab";
    game.alienBullets.forEach((bullet) => {
      context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  }

  function drawOverlay() {
    if (game.state === "Jugando") {
      return;
    }

    context.fillStyle = "rgba(3, 7, 17, 0.72)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.font = "bold 30px Arial";
    context.fillText(game.state, canvas.width / 2, canvas.height / 2 - 10);
    context.font = "18px Arial";
    context.fillText("Presiona R o Reiniciar", canvas.width / 2, canvas.height / 2 + 24);
  }

  function render() {
    drawBackground();
    drawPlayer();
    drawInvaders();
    drawBullets();
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
    if (["ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(event.key) || event.code === "Space") {
      event.preventDefault();
    }

    keys.add(event.key);

    if (event.code === "Space") {
      shootPlayerBullet();
    }

    if (event.key === "r" || event.key === "R") {
      resetGame();
    }
  });

  document.addEventListener("keyup", (event) => {
    keys.delete(event.key);
  });

  resetButton.addEventListener("click", resetGame);

  resetGame();
  window.requestAnimationFrame(loop);
})();
