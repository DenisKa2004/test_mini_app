const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const spriteSheet = new Image();
spriteSheet.src = "path/to/spritesheet.png"; // Путь к твоему спрайт-листу

const frameWidth = 64;  // Ширина одного кадра
const frameHeight = 64; // Высота одного кадра
const totalFrames = 6;  // Количество кадров в анимации (например, для бегущего персонажа)

let currentFrame = 0;  // Индекс текущего кадра
let animationSpeed = 100; // Время между кадрами (в миллисекундах)
let lastFrameTime = 0;  // Время последней отрисовки кадра

function updateAnimation(currentTime) {
  if (currentTime - lastFrameTime > animationSpeed) {
    lastFrameTime = currentTime;
    currentFrame = (currentFrame + 1) % totalFrames;  // Переключаем кадры (по кругу)
  }
}

function drawCharacter() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);  // Очищаем экран

  const x = 100;  // Позиция персонажа по X
  const y = 200;  // Позиция персонажа по Y

  ctx.drawImage(
    spriteSheet,
    currentFrame * frameWidth,  // X-координата кадра на спрайт-листе
    0,  // Y-координата кадра на спрайт-листе (в данном случае все кадры в одном ряду)
    frameWidth, 
    frameHeight,
    x, 
    y, 
    frameWidth, 
    frameHeight
  );
}

function gameLoop(currentTime) {
  updateAnimation(currentTime);
  drawCharacter();
  requestAnimationFrame(gameLoop);  // Рекурсивный вызов для следующего кадра
}

spriteSheet.onload = () => {
  requestAnimationFrame(gameLoop);  // Запуск анимации после загрузки спрайт-листа
};
