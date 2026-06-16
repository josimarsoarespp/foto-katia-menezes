const video = document.getElementById('video');
const startCameraBtn = document.getElementById('startCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const newPhotoBtn = document.getElementById('newPhotoBtn');
const shareBtn = document.getElementById('shareBtn');
const resultImage = document.getElementById('resultImage');
const downloadLink = document.getElementById('downloadLink');
const startScreen = document.getElementById('startScreen');
const cameraScreen = document.getElementById('cameraScreen');
const resultScreen = document.getElementById('resultScreen');
const httpsWarning = document.getElementById('httpsWarning');

const FRAME_SRC = 'assets/moldura-katia-v3.png?v=20260616final';
const EVENT_PHRASE = 'Celebrando a plenitude da vida com o coração cheio de alegria.';
const EVENT_NAME = 'Kátia Menezes';
const EVENT_DATE = '20/6/2026';

let currentStream = null;
let useFrontCamera = true;
let lastBlob = null;
let frameImage = null;

function isSecureCameraContext() {
  return window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

function showScreen(screen) {
  [startScreen, cameraScreen, resultScreen].forEach(item => item.classList.remove('active'));
  screen.classList.add('active');
}

function preloadFrame() {
  return new Promise((resolve, reject) => {
    if (frameImage && frameImage.complete) {
      resolve(frameImage);
      return;
    }

    const img = new Image();
    img.onload = () => {
      frameImage = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = FRAME_SRC;
  });
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Este navegador não liberou acesso à câmera. Abra pelo Chrome, Safari ou Edge atualizado.');
    return;
  }

  if (!isSecureCameraContext()) {
    httpsWarning.classList.remove('hidden');
    alert('A câmera só funciona em HTTPS. Use o link publicado pelo GitHub Pages, começando com https://');
    return;
  }

  stopCamera();

  try {
    await preloadFrame();

    const constraints = {
      audio: false,
      video: {
        facingMode: useFrontCamera ? 'user' : 'environment',
        width: { ideal: 1080 },
        height: { ideal: 1920 },
        aspectRatio: { ideal: 9 / 16 }
      }
    };

    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
    await video.play();
    showScreen(cameraScreen);
  } catch (error) {
    console.error(error);

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      alert('Você negou o acesso à câmera. Toque no cadeado do navegador e permita a câmera. Depois recarregue a página.');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      alert('Não encontrei câmera neste aparelho.');
    } else {
      alert('Não consegui abrir a câmera. Abra pelo link HTTPS do GitHub Pages e permita o acesso à câmera.');
    }
  }
}

function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
}

function drawCoverImage(ctx, source, sourceWidth, sourceHeight, canvasWidth, canvasHeight) {
  const sourceRatio = sourceWidth / sourceHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > canvasRatio) {
    sh = sourceHeight;
    sw = sh * canvasRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sw = sourceWidth;
    sh = sw / canvasRatio;
    sy = (sourceHeight - sh) / 2;
  }

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvasWidth, canvasHeight);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCenteredText(ctx, text, x, y, maxWidth, startSize, fontFamily, color, strokeColor = null) {
  let size = startSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px ${fontFamily}`;

  while (ctx.measureText(text).width > maxWidth && size > 24) {
    size -= 2;
    ctx.font = `900 ${size}px ${fontFamily}`;
  }

  if (strokeColor) {
    ctx.lineWidth = Math.max(4, size * 0.09);
    ctx.strokeStyle = strokeColor;
    ctx.strokeText(text, x, y);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawTextBox(ctx, canvasWidth, canvasHeight) {
  const boxX = canvasWidth * 0.09;
  const boxW = canvasWidth * 0.82;
  const boxH = 255;
  const boxY = canvasHeight - 430;

  ctx.save();
  ctx.fillStyle = 'rgba(255,247,218,0.90)';
  ctx.shadowColor = 'rgba(0,0,0,0.30)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  roundRect(ctx, boxX, boxY, boxW, boxH, 34);
  ctx.fill();
  ctx.restore();

  drawCenteredText(ctx, EVENT_PHRASE, canvasWidth / 2, boxY + 58, boxW - 80, 42, 'Arial', '#4a2b13');
  drawCenteredText(ctx, EVENT_NAME, canvasWidth / 2, boxY + 145, boxW - 60, 76, 'Georgia', '#d4a116', 'rgba(255,243,184,0.8)');
  drawCenteredText(ctx, EVENT_DATE, canvasWidth / 2, boxY + 218, boxW - 80, 42, 'Arial', '#4a2b13');
}

async function capturePhoto() {
  if (!video.videoWidth || !video.videoHeight) {
    alert('A câmera ainda está carregando. Aguarde 1 segundo e tente novamente.');
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 1080;
  canvas.height = 1920;

  if (useFrontCamera) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    drawCoverImage(ctx, video, video.videoWidth, video.videoHeight, canvas.width, canvas.height);
    ctx.restore();
  } else {
    drawCoverImage(ctx, video, video.videoWidth, video.videoHeight, canvas.width, canvas.height);
  }

  const frame = await preloadFrame();
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
  drawTextBox(ctx, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    lastBlob = blob;
    const url = URL.createObjectURL(blob);
    resultImage.src = url;
    downloadLink.href = url;
    showScreen(resultScreen);
    stopCamera();
  }, 'image/png', 1);
}

startCameraBtn.addEventListener('click', startCamera);

captureBtn.addEventListener('click', capturePhoto);

switchCameraBtn.addEventListener('click', async () => {
  useFrontCamera = !useFrontCamera;
  await startCamera();
});

newPhotoBtn.addEventListener('click', async () => {
  await startCamera();
});

shareBtn.addEventListener('click', async () => {
  if (!lastBlob) return;

  const file = new File([lastBlob], 'foto-katia-menezes.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Foto com moldura' });
  } else {
    alert('Seu navegador não permite compartilhar direto. Use o botão Baixar foto.');
  }
});

preloadFrame().catch(error => {
  console.error('Erro ao carregar a moldura:', error);
});

if (!isSecureCameraContext()) {
  httpsWarning.classList.remove('hidden');
}
