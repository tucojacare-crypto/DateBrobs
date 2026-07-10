const loadingEl = document.getElementById('loading');
const emptyEl = document.getElementById('empty');
const deckEl = document.getElementById('deck');
const reactionEl = document.getElementById('reaction');
const summaryEl = document.getElementById('summary');

const cardImage = document.getElementById('cardImage');
const cardNickname = document.getElementById('cardNickname');
const progressEl = document.getElementById('progress');
const cardEl = document.querySelector('.card');

const reactionImage = document.getElementById('reactionImage');
const reactionCaption = document.getElementById('reactionCaption');
const btnContinue = document.getElementById('btnContinue');

const btnNo = document.getElementById('btnNo');
const btnYes = document.getElementById('btnYes');
const btnRestart = document.getElementById('btnRestart');

const yesCountEl = document.getElementById('yesCount');
const noCountEl = document.getElementById('noCount');

let photos = [];
let reactions = { yesUrl: null, yesCaption: '', noUrl: null, noCaption: '' };
let currentIndex = 0;
let counts = { yes: 0, no: 0 };

const bgLayerA = document.getElementById('bgLayerA');
const bgLayerB = document.getElementById('bgLayerB');
let bgImages = [];
let bgIndex = 0;
let bgUsingA = true;
let bgTimer = null;

function showOnly(el) {
  [loadingEl, emptyEl, deckEl, reactionEl, summaryEl].forEach(e => e.classList.add('hidden'));
  el.classList.remove('hidden');
}

function initBackground(images) {
  bgImages = images;
  clearInterval(bgTimer);
  if (bgImages.length === 0) return;

  bgLayerA.style.backgroundImage = `url(${bgImages[0].url})`;
  bgLayerA.classList.add('visible');
  bgIndex = 0;
  bgUsingA = true;

  if (bgImages.length > 1) {
    bgTimer = setInterval(rotateBackground, 8000);
  }
}

function rotateBackground() {
  bgIndex = (bgIndex + 1) % bgImages.length;
  const nextLayer = bgUsingA ? bgLayerB : bgLayerA;
  const currentLayer = bgUsingA ? bgLayerA : bgLayerB;
  nextLayer.style.backgroundImage = `url(${bgImages[bgIndex].url})`;
  nextLayer.classList.add('visible');
  currentLayer.classList.remove('visible');
  bgUsingA = !bgUsingA;
}

async function init() {
  showOnly(loadingEl);
  const [photosRes, reactionsRes, backgroundRes] = await Promise.all([
    fetch('/api/photos').then(r => r.json()),
    fetch('/api/reactions').then(r => r.json()),
    fetch('/api/background').then(r => r.json())
  ]);
  photos = photosRes;
  reactions = reactionsRes;
  currentIndex = 0;
  counts = { yes: 0, no: 0 };
  initBackground(backgroundRes);

  if (photos.length === 0) {
    showOnly(emptyEl);
    return;
  }
  showCard();
}

function showCard() {
  showOnly(deckEl);
  cardEl.style.transform = '';
  cardEl.style.opacity = '1';
  const photo = photos[currentIndex];
  cardImage.src = photo.url;
  cardNickname.textContent = photo.nickname;
  progressEl.textContent = `${currentIndex + 1} / ${photos.length}`;
}

function decide(isYes) {
  cardEl.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
  cardEl.style.transform = isYes ? 'translateX(120%) rotate(15deg)' : 'translateX(-120%) rotate(-15deg)';
  cardEl.style.opacity = '0';

  if (isYes) counts.yes += 1; else counts.no += 1;

  setTimeout(() => {
    cardEl.style.transition = '';
    showReaction(isYes);
  }, 220);
}

function showReaction(isYes) {
  const url = isYes ? reactions.yesUrl : reactions.noUrl;
  const caption = isYes ? reactions.yesCaption : reactions.noCaption;

  if (!url) {
    advance();
    return;
  }

  reactionImage.src = url;
  reactionCaption.textContent = caption;
  showOnly(reactionEl);
}

function advance() {
  currentIndex += 1;
  if (currentIndex >= photos.length) {
    yesCountEl.textContent = counts.yes;
    noCountEl.textContent = counts.no;
    showOnly(summaryEl);
    return;
  }
  showCard();
}

btnNo.addEventListener('click', () => decide(false));
btnYes.addEventListener('click', () => decide(true));
btnContinue.addEventListener('click', advance);
btnRestart.addEventListener('click', init);

init();
