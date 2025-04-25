// game.js
window.onload = function() {
  const canvas    = document.getElementById("gameCanvas");
  const ctx       = canvas.getContext("2d");
  const container = document.getElementById("gameContainer");

  // Виртуальное разрешение игры
  const GAME_W = 400;
  const GAME_H = 800;

  // Параметры игры
  const gameSpeed = 3;
  const gravity   = 0.6;
  const jumpPower = -14;
  const runFrames      = 15;
  const jumpFrames     = 15;
  const animationSpeed = 50;

  // Состояния
  let scrollOffset   = 0;
  let currentFrame   = 0;
  let jumpFrame      = 0;
  let lastFrameTime  = 0;
  let isJumping      = false;
  let isGrounded     = true;
  let velocity       = 0;
  let score          = 0;
  let isPaused       = false;
  let gameOver       = false;

  // Коэффициенты масштабирования UI (если понадобится)
  let scaleX = 1, scaleY = 1;

  // Персонаж
  const character = {
    x:100, y:200, baseY:200,
    spriteW:128, spriteH:118,
    offX:34, offY:7,
    w:30, h:90,
    hbX:15, hbY:4
  };

  // Платформы, препятствия и монеты
  let platforms = [{ x:0, y:320, w:800, h:20 }];
  let obstacles = [];
  let coins     = [];

  // Фоновые слои (параллакс)
  const bgLayers = [
    { file: '11_background.png',      speed: 0,   img: new Image() },
    { file: '10_distant_clouds.png',  speed: 0.1, img: new Image() },
    { file: '09_distant_clouds1.png', speed: 0.12,img: new Image() },
    { file: '08_clouds.png',          speed: 0.2, img: new Image() },
    { file: '07_huge_clouds.png',     speed: 0.25,img: new Image() },
    { file: '06_hill2.png',           speed: 0.3, img: new Image() },
    { file: '05_hill1.png',           speed: 0.35,img: new Image() },
    { file: '04_bushes.png',          speed: 0.45,img: new Image() },
    { file: '03_distant_trees.png',   speed: 0.5, img: new Image() },
    { file: '02_trees_and_bushes.png',speed: 0.7, img: new Image() },
    { file: '01_ground.png',          speed: 1,   img: new Image() }
  ];

  // Спрайты
  const runSprite     = new Image(); runSprite.src     = "spritesheet.png";
  const jumpSprite    = new Image(); jumpSprite.src    = "spritesheet_jump.png";
  const coinImage     = new Image(); coinImage.src     = "coin.png";
  const obstacleImage = new Image(); obstacleImage.src = "obstacle.png";

  // Загрузка фоновых изображений
  let loadedBg = 0;
  bgLayers.forEach(layer => {
    layer.img.onload = () => {
      loadedBg++;
      if (loadedBg === bgLayers.length) initGame();
    };
    layer.img.onerror = () => console.error(`Ошибка загрузки ${layer.file}`);
    layer.img.src = layer.file;
  });

  // Пауза
  document.getElementById('pauseBtn').onclick = () => {
    isPaused = !isPaused;
  };

  // Обработка ввода (клик или тап)
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

  // Подстройка размера канваса при старте и при изменении окна
  function onResize() {
    const isLandscape = window.innerWidth > window.innerHeight;

    // Внутреннее разрешение канваса
    if (isLandscape) {
      canvas.width  = GAME_H;
      canvas.height = GAME_W;
    } else {
      canvas.width  = GAME_W;
      canvas.height = GAME_H;
    }

    // CSS-растяжка контейнера на весь экран
    container.style.width  = window.innerWidth + "px";
    container.style.height = window.innerHeight + "px";

    // Масштаб UI (если нужен)
    scaleX = (window.innerWidth)  / GAME_W;
    scaleY = (window.innerHeight) / GAME_H;
  }
  window.addEventListener("resize", onResize);
  onResize();

  // Запуск игры
  function initGame() {
    requestAnimationFrame(gameLoop);
  }

  // Основной цикл
  function gameLoop(timestamp) {
    // Очистка всего канваса
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

  // Функции отрисовки и обновления

  function drawParallax() {
    bgLayers.forEach(layer => {
      const w = canvas.width, h = canvas.height;
      if (layer.speed === 0) {
        ctx.drawImage(layer.img, 0, 0, w, h);
      } else {
        let x = -(scrollOffset * layer.speed) % w;
        if (x > 0) x -= w;
        ctx.drawImage(layer.img, x,    0, w, h);
        ctx.drawImage(layer.img, x+w,  0, w, h);
      }
    });
  }

  function updateAnimation(dt) {
    if (gameOver || isPaused) return;
    const hb = getHitbox();

    if (dt - lastFrameTime > animationSpeed) {
      lastFrameTime = dt;
      if (isJumping) jumpFrame = (jumpFrame + 1) % jumpFrames;
      else          currentFrame = (currentFrame + 1) % runFrames;
    }

    // Физика
    character.y += velocity;
    velocity += gravity;
    isGrounded = false;

    platforms.forEach(p => {
      if (
        character.y + character.h >= p.y &&
        character.y + character.h <= p.y + velocity + 5 &&
        character.x + character.w > p.x &&
        character.x < p.x + p.w
      ) {
        character.y = p.y - character.h;
        velocity    = 0;
        isGrounded  = true;
        isJumping   = false;
      }
    });

    // Столкновения с препятствиями
    obstacles.forEach(o => {
      if (
        hb.x < o.x + o.w &&
        hb.x + hb.w > o.x &&
        hb.y < o.y + o.h &&
        hb.y + hb.h > o.y
      ) {
        gameOver = true;
      }
    });

    // Сбор монет
    coins = coins.filter(c => {
      if (
        hb.x < c.x + c.size &&
        hb.x + hb.w > c.x &&
        hb.y < c.y + c.size &&
        hb.y + hb.h > c.y
      ) {
        score += 10;
        return false;
      }
      return true;
    });

    // Сдвиг объектов влево
    platforms = platforms.map(p => ({ ...p, x: p.x - gameSpeed }));
    obstacles = obstacles.map(o => ({ ...o, x: o.x - gameSpeed })).filter(o => o.x + o.w > 0);
    coins     = coins.map(c => ({ ...c, x: c.x - gameSpeed })).filter(c => c.x + c.size > 0);

    score += 0.05;

    // Генерация новой платформы
    const lastPlat = platforms[platforms.length -1];
    if (lastPlat.x + lastPlat.w < canvas.width) {
      platforms.push({
        x: lastPlat.x + lastPlat.w,
        y: 320,
        w: 300 + Math.random()*200,
        h: 20
      });
    }

    // Новые препятствия и монеты
    if (Math.random() < 0.008) {
      const y = Math.random() < 0.5
        ? character.y - 60
        : platforms[platforms.length-1].y - 30;
      obstacles.push({ x: canvas.width, y, w:30, h:30 });
    }
    if (Math.random() < 0.02) {
      coins.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - 50),
        size: 32
      });
    }
  }

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
    const frame  = isJumping ? jumpFrame : currentFrame;
    ctx.drawImage(
      sprite,
      frame * character.spriteW, 0,
      character.spriteW, character.spriteH,
      character.x - character.offX,
      character.y - character.offY,
      character.spriteW,
      character.spriteH
    );
    // Рисуем хитбокс (для отладки)
    // const hb = getHitbox();
    // ctx.strokeStyle = 'red';
    // ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
  }

  function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font      = `${24 * scaleY}px Arial`;
    ctx.fillText(`Очки: ${Math.floor(score)}`, 20 * scaleX, 30 * scaleY);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle   = '#fff';
    ctx.textAlign   = 'center';
    ctx.font        = `${36 * scaleY}px Arial`;
    ctx.fillText('Игра окончена',      canvas.width / 2, canvas.height / 2 - 20);
    ctx.font        = `${24 * scaleY}px Arial`;
    ctx.fillText('Клик для рестарта', canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign   = 'left';
  }

  function getHitbox() {
    return {
      x: character.x - character.offX + character.hbX,
      y: character.y - character.offY + character.hbY,
      w: character.w,
      h: character.h
    };
  }

  function restartGame() {
    platforms = [{ x:0, y:320, w:800, h:20 }];
    obstacles = [];
    coins     = [];
    score     = 0;
    character.y = character.baseY;
    velocity    = 0;
    currentFrame = jumpFrame = lastFrameTime = 0;
    gameOver     = false;
  }
};
