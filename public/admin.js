const photoForm = document.getElementById('photoForm');
const photoInput = document.getElementById('photoInput');
const photoGrid = document.getElementById('photoGrid');

const yesForm = document.getElementById('yesForm');
const yesImageInput = document.getElementById('yesImageInput');
const yesCaptionInput = document.getElementById('yesCaptionInput');
const yesPreview = document.getElementById('yesPreview');

const noForm = document.getElementById('noForm');
const noImageInput = document.getElementById('noImageInput');
const noCaptionInput = document.getElementById('noCaptionInput');
const noPreview = document.getElementById('noPreview');

const bgForm = document.getElementById('bgForm');
const bgInput = document.getElementById('bgInput');
const bgGrid = document.getElementById('bgGrid');

async function loadPhotos() {
  const photos = await fetch('/api/photos').then(r => r.json());
  photoGrid.innerHTML = '';
  photos.forEach(p => {
    const item = document.createElement('div');
    item.className = 'photo-item';
    item.innerHTML = `
      <img src="${p.url}" alt="${p.nickname}">
      <span class="tag">${p.nickname}</span>
      <button class="delete-btn" data-id="${p.id}" aria-label="Excluir">×</button>
    `;
    photoGrid.appendChild(item);
  });
}

async function loadBackground() {
  const images = await fetch('/api/background').then(r => r.json());
  bgGrid.innerHTML = '';
  images.forEach(img => {
    const item = document.createElement('div');
    item.className = 'photo-item';
    item.innerHTML = `
      <img src="${img.url}" alt="Fundo">
      <button class="delete-btn" data-id="${img.id}" aria-label="Excluir">×</button>
    `;
    bgGrid.appendChild(item);
  });
}

async function loadReactions() {
  const r = await fetch('/api/reactions').then(res => res.json());
  yesCaptionInput.value = r.yesCaption || '';
  noCaptionInput.value = r.noCaption || '';
  yesPreview.innerHTML = r.yesUrl ? `<img src="${r.yesUrl}"><p>${r.yesCaption}</p>` : '<p>Nenhuma imagem definida ainda.</p>';
  noPreview.innerHTML = r.noUrl ? `<img src="${r.noUrl}"><p>${r.noCaption}</p>` : '<p>Nenhuma imagem definida ainda.</p>';
}

photoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = photoInput.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('photo', file);
  await fetch('/api/photos', { method: 'POST', body: formData });
  photoForm.reset();
  loadPhotos();
});

photoGrid.addEventListener('click', async (e) => {
  if (!e.target.matches('.delete-btn')) return;
  const id = e.target.dataset.id;
  await fetch(`/api/photos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  loadPhotos();
});

bgForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = bgInput.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('image', file);
  await fetch('/api/background', { method: 'POST', body: formData });
  bgForm.reset();
  loadBackground();
});

bgGrid.addEventListener('click', async (e) => {
  if (!e.target.matches('.delete-btn')) return;
  const id = e.target.dataset.id;
  await fetch(`/api/background?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  loadBackground();
});

yesForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  if (yesImageInput.files[0]) formData.append('image', yesImageInput.files[0]);
  formData.append('caption', yesCaptionInput.value);
  await fetch('/api/reactions/yes', { method: 'POST', body: formData });
  loadReactions();
});

noForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  if (noImageInput.files[0]) formData.append('image', noImageInput.files[0]);
  formData.append('caption', noCaptionInput.value);
  await fetch('/api/reactions/no', { method: 'POST', body: formData });
  loadReactions();
});

loadPhotos();
loadBackground();
loadReactions();
