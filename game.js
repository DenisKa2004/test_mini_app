const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const runSprite = new Image();
runSprite.src = "spritesheet.png";

const jumpSprite = new Image();
jumpSprite.src = "spritesheet_jump.png";

const coinImage = new Image();
coinImage.src = "coin.png"; // Монетка (размером 32x32 например)

const obstacleImage = new Image();
obstacleImage.src = "obstacle.png"; // твоя текстура препятствий

const flyingObstacleImage = new Image();
flyingObstacleImage.src = "obstacle_flying.png"; // для летающих препятствий

// Кнопка паузы
const pauseButton = document.createElement("button");
pauseButton.textContent = "⏸ Пауза";
pauseButton.style.position = "absolute";
pauseButton.style.top = "10px";
pauseButton.style.right = "10px";
pauseButton.style.zIndex = 10;
pauseButton.onclick = () => isPaused = !isPaused;
document.body.appendChild(pauseButton);

let isPaused = false;

const frameWidth = 128;
const frameHeight = 118;
const runFrames = 15;
const jumpFrames = 15;

let currentFrame = 0;
let jumpFrame = 0;
let animationSpeed = 50;
let lastFrameTime = 0;

let isJumping = false;
let isGrounded = true;
let velocity = 0;
let gravity = 0.6;
let jumpPower = -14;

let score = 0;
let gameOver = false;

const character = {
  x: 100,
  y: 200,
  baseY: 200,
  spriteWidth: 128,
  spriteHeight: 118,
  offsetX: 34,
  offsetY: 7,
  width: 30,
  height: 90,
  hitboxOffsetX: 15,
  hitboxOffsetY: 4
};

let platforms = [
  { x: 0, y: 320, width: 800, height: 20 },
];

let obstacles = [];
let coins = [];

// Обновление размера канваса для адаптивности
function resizeCanvas() {
  const aspectRatio = 800 / 400;  // Исходное соотношение сторон
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Расчёт новых размеров канваса
  if (windowWidth / windowHeight > aspectRatio) {
    canvas.width = windowHeight * aspectRatio;
    canvas.height = windowHeight;
  } else {
    canvas.width = windowWidth;
    canvas.height = windowWidth / aspectRatio;
  }
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
}

// Слушаем событие изменения размера окна
window.addEventListener("resize", resizeCanvas);

// Начальная настройка размера канваса
resizeCanvas();

// Обновлённый updateAnimation
function updateAnimation(deltaTime) {
  if (gameOver || isPaused) return;

  const hitbox = getCharacterHitbox();

  if (deltaTime - lastFrameTime > animationSpeed) {
    lastFrameTime = deltaTime;
    if (isJumping) jumpFrame = (jumpFrame + 1) % jumpFrames;
    else currentFrame = (currentFrame + 1) % runFrames;
  }

  character.y += velocity;
  velocity += gravity;

  isGrounded = false;
  for (let platform of platforms) {
    if (
      character.y + character.height >= platform.y &&
      character.y + character.height <= platform.y + velocity + 5 &&
      character.x + character.width > platform.x &&
      character.x < platform.x + platform.width
    ) {
      character.y = platform.y - character.height;
      velocity = 0;
      isGrounded = true;
      isJumping = false;
      break;
    }
  }

  for (let obs of obstacles) {
    if (
      hitbox.x < obs.x + obs.width &&
      hitbox.x + hitbox.width > obs.x &&
      hitbox.y < obs.y + obs.height &&
      hitbox.y + hitbox.height > obs.y
    ) {
      gameOver = true;
    }
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    if (
      hitbox.x < coin.x + coin.size &&
      hitbox.x + hitbox.width > coin.x &&
      hitbox.y < coin.y + coin.size &&
      hitbox.y + hitbox.height > coin.y
    ) {
      coins.splice(i, 1);
      score += 10;
    }
  }

  // Обновляем позиции платформ, препятствий и монет
  platforms.forEach(p => p.x -= 3);
  obstacles.forEach(o => o.x -= 3);
  coins.forEach(c => c.x -= 3);

  score += 0.05;

  // Спавн новых платформ, препятствий и монет
  if (platforms[platforms.length - 1].x + platforms[platforms.length - 1].width < canvas.width) {
    const newX = platforms[platforms.length - 1].x + platforms[platforms.length - 1].width;
    platforms.push({ x: newX, y: 320, width: 300 + Math.random() * 200, height: 20 });
  }

  if (Math.random() < 0.008) {
    const isFlying = Math.random() < 0.5;
  
    if (isFlying) {
      // Летающее препятствие — чуть выше игрока
      const flyingY = character.y - 60;
      obstacles.push({
        x: canvas.width,
        y: flyingY,
        width: 30,
        height: 30,
        type: "flying"
      });
    } else {
      // Обычное препятствие — на уровне земли (с учетом высоты платформы)
      const groundY = platforms[platforms.length - 1].y - 30;
      obstacles.push({
        x: canvas.width,
        y: groundY,
        width: 30,
        height: 30,
        type: "ground"
      });
    }
  }
  

  if (Math.random() < 0.02) {
    const randomY = Math.random() * (canvas.height - 50); // Высота для монеты
    coins.push({ x: canvas.width, y: randomY, size: 32 });
  }

  // Убираем объекты, которые ушли за пределы экрана
  platforms = platforms.filter(p => p.x + p.width > 0);
  obstacles = obstacles.filter(o => o.x + o.width > 0);
  coins = coins.filter(c => c.x + c.size > 0);
}

// Обработчик клика
canvas.addEventListener('click', (e) => {
  if (gameOver) {
    restartGame();
  } else if (!isJumping && isGrounded) {
    velocity = jumpPower;
    isJumping = true;
  }
});

function drawCharacter() {
  const sprite = isJumping ? jumpSprite : runSprite;
  const frame = isJumping ? jumpFrame : currentFrame;

  ctx.drawImage(
    sprite,
    frame * character.spriteWidth,
    0,
    character.spriteWidth,
    character.spriteHeight,
    character.x - character.offsetX,
    character.y - character.offsetY,
    character.spriteWidth,
    character.spriteHeight
  );

  const hitbox = getCharacterHitbox();
  ctx.strokeStyle = "red";
  ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
}

function getCharacterHitbox() {
  return {
    x: character.x - character.offsetX + character.hitboxOffsetX,
    y: character.y - character.offsetY + character.hitboxOffsetY,
    width: character.width,
    height: character.height
  };
}

// Рисование с текстурами
function drawPlatformsAndObstacles() {
  ctx.fillStyle = "#654321";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

  obstacles.forEach(o => {
    if (o.type === "flying" && flyingObstacleImage.complete) {
      ctx.drawImage(flyingObstacleImage, o.x, o.y, o.width, o.height);
    } else if (obstacleImage.complete) {
      ctx.drawImage(obstacleImage, o.x, o.y, o.width, o.height);
    } else {
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(o.x, o.y, o.width, o.height);
    }
  });
  
}

function drawCoins() {
  coins.forEach(c => {
    ctx.drawImage(coinImage, c.x, c.y, c.size, c.size);
  });
}

function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "24px Arial";
  ctx.fillText("Очки: " + Math.floor(score), 20, 30);
}

function drawGameOverScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Игра окончена", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "24px Arial";
  ctx.fillText("Нажмите, чтобы начать заново", canvas.width / 2, canvas.height / 2 + 20);
  ctx.textAlign = "left";
}

function drawBackground() {
  ctx.fillStyle = "#d0f4f7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function restartGame() {
  platforms = [{ x: 0, y: 320, width: 800, height: 20 }];
  obstacles = [];
  coins = [];
  score = 0;
  character.y = character.baseY;
  velocity = 0;
  gameOver = false;
  currentFrame = 0;
  jumpFrame = 0;
}

function gameLoop(currentTime) {
  drawBackground();
  updateAnimation(currentTime);
  drawPlatformsAndObstacles();
  drawCoins();
  drawCharacter();
  drawScore();
  if (gameOver) drawGameOverScreen();
  requestAnimationFrame(gameLoop);
}

runSprite.onload = () => {
  requestAnimationFrame(gameLoop);
};
