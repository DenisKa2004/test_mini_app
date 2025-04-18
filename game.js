const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const runSprite = new Image();
runSprite.src = "spritesheet.png";

const jumpSprite = new Image();
jumpSprite.src = "spritesheet_jump.png";

const coinImage = new Image();
coinImage.src = "coin.png"; // Монетка (размером 32x32 например)

const frameWidth = 128;
const frameHeight = 118;
const runFrames = 15;
const jumpFrames = 15;

let currentFrame = 0;
let jumpFrame = 0;
let animationSpeed = 100;
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
  width: frameWidth,
  height: frameHeight
};

let platforms = [
  { x: 0, y: 320, width: 800, height: 20 },
];

let obstacles = [
  { x: 600, y: 302, width: 10, height: 18 },
];

let coins = [];

function handleInput() {
  if (!isJumping && isGrounded && !gameOver) {
    isJumping = true;
    isGrounded = false;
    velocity = jumpPower;
    jumpFrame = 0;
  } else if (gameOver) {
    restartGame();
  }
}

canvas.addEventListener("mousedown", handleInput);
canvas.addEventListener("touchstart", handleInput);

function updateAnimation(deltaTime) {
  if (gameOver) return;

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
      character.x < obs.x + obs.width &&
      character.x + character.width > obs.x &&
      character.y < obs.y + obs.height &&
      character.y + character.height > obs.y
    ) {
      gameOver = true;
    }
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    if (
      character.x < coin.x + coin.size &&
      character.x + character.width > coin.x &&
      character.y < coin.y + coin.size &&
      character.y + character.height > coin.y
    ) {
      coins.splice(i, 1);
      score += 10;
    }
  }

  // Автоскролл
  platforms.forEach(p => p.x -= 3);
  obstacles.forEach(o => o.x -= 3);
  coins.forEach(c => c.x -= 3);

  score += 0.05;

  // Платформы бесконечные
  if (platforms[platforms.length - 1].x + platforms[platforms.length - 1].width < canvas.width) {
    const newX = platforms[platforms.length - 1].x + platforms[platforms.length - 1].width;
    platforms.push({ x: newX, y: 320, width: 300 + Math.random() * 200, height: 20 });
  }

  platforms = platforms.filter(p => p.x + p.width > 0);
  obstacles = obstacles.filter(o => o.x + o.width > 0);
  coins = coins.filter(c => c.x + c.size > 0);

  // Добавление препятствий и монет
  if (Math.random() < 0.01) {
    obstacles.push({ x: canvas.width + Math.random() * 200, y: 302, width: 30, height: 18 });
  }

  if (Math.random() < 0.01) {
    coins.push({ x: canvas.width + Math.random() * 300, y: 260, size: 32 });
  }
}

function drawCharacter() {
  const sprite = isJumping ? jumpSprite : runSprite;
  const frame = isJumping ? jumpFrame : currentFrame;

  ctx.drawImage(
    sprite,
    frame * frameWidth,
    0,
    frameWidth,
    frameHeight,
    character.x,
    character.y,
    frameWidth,
    frameHeight
  );
}

function drawPlatformsAndObstacles() {
  ctx.fillStyle = "#654321";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

  ctx.fillStyle = "#ff0000";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));
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
