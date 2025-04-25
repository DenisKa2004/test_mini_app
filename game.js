// game.js
window.onload = function() {
  const canvas = document.getElementById("gameCanvas");
  const ctx    = canvas.getContext("2d");

  
  // Фиксируем внутреннее разрешение канваса
  const GAME_WIDTH  = 400;
  const GAME_HEIGHT = 800;
  canvas.width  = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  let scaleX = canvas.width  / GAME_WIDTH;
  let scaleY = canvas.height / GAME_HEIGHT;
  let scrollOffset = 0;
  const gameSpeed = 3;

  // Анимация
  const runFrames  = 15;
  const jumpFrames = 15;
  const animationSpeed = 50;

  // Физика
  const gravity   = 0.6;
  const jumpPower = -14;

  // Состояние
  let currentFrame   = 0;
  let jumpFrame      = 0;
  let lastFrameTime  = 0;
  let isJumping      = false;
  let isGrounded     = true;
  let velocity       = 0;
  let score          = 0;
  let isPaused       = false;
  let gameOver       = false;

  // Персонаж
  const character = { x:100, y:200, baseY:200,
    spriteW:128, spriteH:118, offX:34, offY:7,
    w:30, h:90, hbX:15, hbY:4 };

  let platforms = [{ x:0, y:320, w:800, h:20 }];
  let obstacles = [];
  let coins     = [];

  // Load images
  const bgLayers = [
    { file: '11_background.png', speed: 0, img: new Image() },
    { file: '10_distant_clouds.png', speed: 0.1, img: new Image() },
    { file: '09_distant_clouds1.png', speed: 0.12, img: new Image() },
    { file: '08_clouds.png', speed: 0.2, img: new Image() },
    { file: '07_huge_clouds.png', speed: 0.25, img: new Image() },
    { file: '06_hill2.png', speed: 0.3, img: new Image() },
    { file: '05_hill1.png', speed: 0.35, img: new Image() },
    { file: '04_bushes.png', speed: 0.45, img: new Image() },
    { file: '03_distant_trees.png', speed: 0.5, img: new Image() },
    { file: '02_trees_and_bushes.png', speed: 0.7, img: new Image() },
    { file: '01_ground.png', speed: 1, img: new Image() }
  ];

  function resizeCanvasResolution() {
    const isLandscape = window.innerWidth > window.innerHeight;
    if (isLandscape) {
      canvas.width  = GAME_HEIGHT;
      canvas.height = GAME_WIDTH;
    } else {
      canvas.width  = GAME_WIDTH;
      canvas.height = GAME_HEIGHT;
    }
  }
  window.addEventListener('resize', resizeCanvasResolution);
  resizeCanvasResolution();
  let loadedBg = 0;
  bgLayers.forEach(layer => {
    layer.img.src = layer.file;
    layer.img.onload = () => {
      loadedBg++;
      if (loadedBg === bgLayers.length) initGame();
    };
    layer.img.onerror = () => console.error(`${layer.file} not found`);
  });

  const runSprite = new Image(); runSprite.src = "spritesheet.png";
  const jumpSprite = new Image(); jumpSprite.src = "spritesheet_jump.png";
  const coinImage = new Image(); coinImage.src = "coin.png";
  const obstacleImage = new Image(); obstacleImage.src = "obstacle.png";

  // Setup pause button
  document.getElementById('pauseBtn').onclick = () => { isPaused = !isPaused; };

  // Responsive canvas
  function resizeCanvas() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const ar = GAME_WIDTH / GAME_HEIGHT;
    if (ww / wh > ar) {
      canvas.height = wh;
      canvas.width = wh * ar;
    } else {
      canvas.width = ww;
      canvas.height = ww / ar;
    }
    scaleX = canvas.width / GAME_WIDTH;
    scaleY = canvas.height / GAME_HEIGHT;
  }
  window.addEventListener('resize', resizeCanvas);

  // Input
  canvas.addEventListener('click', handleInput);
  canvas.addEventListener('touchstart', handleInput);
  function handleInput() {
    if (gameOver) restartGame();
    else if (!isJumping && isGrounded) {
      isJumping  = true;
      isGrounded = false;
      velocity   = jumpPower;
      jumpFrame  = 0;
    }
  }

  // Initialize game after backgrounds loaded
  function initGame() {
    //resizeCanvas();
    requestAnimationFrame(gameLoop);
  }

  // Draw parallax background
  function drawParallax() {
    bgLayers.forEach(layer => {
      if (layer.speed === 0) {
        ctx.drawImage(layer.img, 0, 0, canvas.width, canvas.height);
      } else {
        let x = -(scrollOffset * layer.speed) % canvas.width;
        if (x > 0) x -= canvas.width;
        ctx.drawImage(layer.img, x, 0, canvas.width, canvas.height);
        ctx.drawImage(layer.img, x + canvas.width, 0, canvas.width, canvas.height);
      }
    });
  }

  // Update animation & physics
  function updateAnimation(deltaTime) {
    if (gameOver || isPaused) return;
    const hitbox = getHitbox();
    if (deltaTime - lastFrameTime > animationSpeed) {
      lastFrameTime = deltaTime;
      if (isJumping) jumpFrame = (jumpFrame + 1) % jumpFrames;
      else currentFrame = (currentFrame + 1) % runFrames;
    }
    character.y += velocity;
    velocity += gravity;
    isGrounded = false;
    platforms.forEach(p => {
      if (character.y + character.h >= p.y && character.y + character.h <= p.y + velocity + 5 && character.x + character.w > p.x && character.x < p.x + p.w) {
        character.y = p.y - character.h;
        velocity = 0;
        isGrounded = true;
        isJumping = false;
      }
    });
    obstacles.forEach(o => { if (hitbox.x < o.x + o.w && hitbox.x + hitbox.w > o.x && hitbox.y < o.y + o.h && hitbox.y + hitbox.h > o.y) gameOver = true; });
    coins.forEach((c,i) => { if (hitbox.x < c.x + c.size && hitbox.x + hitbox.w > c.x && hitbox.y < c.y + c.size && hitbox.y + hitbox.h > c.y) { coins.splice(i,1); score += 10; }});
    platforms = platforms.map(p => ({ ...p, x: p.x - gameSpeed }));
    obstacles = obstacles.map(o => ({ ...o, x: o.x - gameSpeed })).filter(o => o.x + o.w > 0);
    coins = coins.map(c => ({ ...c, x: c.x - gameSpeed })).filter(c => c.x + c.size > 0);
    score += 0.05;
    if (platforms[platforms.length-1].x + platforms[platforms.length-1].w < canvas.width) {
      const newX = platforms[platforms.length-1].x + platforms[platforms.length-1].w;
      platforms.push({ x: newX, y: 320, w: 300 + Math.random()*200, h: 20 });
    }
    if (Math.random() < 0.008) {
      const isFlying = Math.random() < 0.5;
      if (isFlying) obstacles.push({ x: canvas.width, y: character.y - 60, w: 30, h: 30 });
      else obstacles.push({ x: canvas.width, y: platforms[platforms.length-1].y - 30, w: 30, h: 30 });
    }
    if (Math.random() < 0.02) coins.push({ x: canvas.width, y: Math.random()*(canvas.height-50), size: 32 });
  }

  // Draw functions
  function drawPlatforms() {
    ctx.fillStyle = "#654321";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));
  }
  function drawObstacles() {
    obstacles.forEach(o => ctx.drawImage(obstacleImage, o.x, o.y, o.w, o.h));
  }
  function drawCoins() {
    coins.forEach(c => ctx.drawImage(coinImage, c.x, c.y, c.size, c.size));
  }
  function drawCharacter() {
    const sprite = isJumping ? jumpSprite : runSprite;
    const frame = isJumping ? jumpFrame : currentFrame;
    ctx.drawImage(sprite, frame * character.spriteW, 0, character.spriteW, character.spriteH, character.x - character.offX, character.y - character.offY, character.spriteW, character.spriteH);
    const hb = getHitbox(); ctx.strokeStyle = 'red'; ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
  }
  function drawScore() {
    ctx.fillText('Очки: '+Math.floor(score), 20 * scaleX, 30 * scaleY);
  }
  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Игра окончена',      canvas.width/2,  canvas.height/2 - 20);
    ctx.font      = '24px Arial';
    ctx.fillText('Клик для рестарта', canvas.width/2,  canvas.height/2 + 20);
    ctx.textAlign = 'left';
  }
  function getHitbox() { return { x: character.x - character.offX + character.hbX, y: character.y - character.offY + character.hbY, w: character.w, h: character.h }; }
  function restartGame() {
    platforms = [{ x: 0, y: 320, w: 800, h: 20 }]; obstacles = []; coins = []; score = 0; character.y = character.baseY; velocity = 0; currentFrame = jumpFrame = lastFrameTime = 0; gameOver = false;
  }

  // Start if backgrounds already loaded
  if (loadedBg === bgLayers.length) initGame();

  function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    drawParallax();
    drawPlatforms();
    drawObstacles();
    drawCoins();
    drawCharacter();
    drawScore();
  
    if (gameOver) {
      drawGameOver();
    } else if (!isPaused) {
      updateAnimation(timestamp);
      scrollOffset += gameSpeed;
    }
  
    requestAnimationFrame(gameLoop);
  }
  
};






  



