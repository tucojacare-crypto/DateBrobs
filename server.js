require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({ secure: true });

const NICKNAMES = ['rafa', 'brocha', 'brobs'];
const FOLDERS = {
  photos: 'date-brobs/photos',
  background: 'date-brobs/background'
};
const REACTION_IDS = {
  yes: 'date-brobs/reactions/yes',
  no: 'date-brobs/reactions/no'
};

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

async function listFolder(folder) {
  const result = await cloudinary.api.resources({
    type: 'upload',
    prefix: `${folder}/`,
    context: true,
    max_results: 500
  });
  const resources = result.resources || [];
  resources.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return resources;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/photos', async (req, res, next) => {
  try {
    const resources = await listFolder(FOLDERS.photos);
    res.json(resources.map(r => ({
      id: r.public_id,
      nickname: (r.context && r.context.custom && r.context.custom.nickname) || 'rafa',
      url: r.secure_url
    })));
  } catch (err) { next(err); }
});

app.post('/api/photos', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma foto enviada' });

    const existing = await listFolder(FOLDERS.photos);
    const nickname = NICKNAMES[existing.length % NICKNAMES.length];

    const result = await uploadBuffer(req.file.buffer, {
      folder: FOLDERS.photos,
      context: `nickname=${nickname}`
    });

    res.json({ id: result.public_id, nickname, url: result.secure_url });
  } catch (err) { next(err); }
});

app.delete('/api/photos', async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id obrigatorio' });
    await cloudinary.uploader.destroy(id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.get('/api/background', async (req, res, next) => {
  try {
    const resources = await listFolder(FOLDERS.background);
    res.json(resources.map(r => ({ id: r.public_id, url: r.secure_url })));
  } catch (err) { next(err); }
});

app.post('/api/background', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    const result = await uploadBuffer(req.file.buffer, { folder: FOLDERS.background });
    res.json({ id: result.public_id, url: result.secure_url });
  } catch (err) { next(err); }
});

app.delete('/api/background', async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id obrigatorio' });
    await cloudinary.uploader.destroy(id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

async function getReaction(type) {
  try {
    const resource = await cloudinary.api.resource(REACTION_IDS[type], { context: true });
    return {
      url: resource.secure_url,
      caption: (resource.context && resource.context.custom && resource.context.custom.caption) || defaultCaption(type)
    };
  } catch {
    return { url: null, caption: defaultCaption(type) };
  }
}

function defaultCaption(type) {
  return type === 'no' ? 'vai ter que querer sim sou o brojack' : 'Ela disse sim!';
}

app.get('/api/reactions', async (req, res, next) => {
  try {
    const [yes, no] = await Promise.all([getReaction('yes'), getReaction('no')]);
    res.json({ yesUrl: yes.url, yesCaption: yes.caption, noUrl: no.url, noCaption: no.caption });
  } catch (err) { next(err); }
});

async function saveReaction(type, file, caption) {
  const current = await getReaction(type);
  const finalCaption = (caption && caption.trim()) || current.caption;

  if (file) {
    await uploadBuffer(file.buffer, {
      public_id: REACTION_IDS[type],
      overwrite: true,
      invalidate: true,
      context: `caption=${finalCaption}`
    });
  } else if (current.url) {
    await cloudinary.uploader.add_context(`caption=${finalCaption}`, [REACTION_IDS[type]]);
  }
}

app.post('/api/reactions/yes', upload.single('image'), async (req, res, next) => {
  try {
    await saveReaction('yes', req.file, req.body.caption);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.post('/api/reactions/no', upload.single('image'), async (req, res, next) => {
  try {
    await saveReaction('no', req.file, req.body.caption);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro no servidor' });
});

app.listen(PORT, () => {
  console.log(`DateBrobs rodando em http://localhost:${PORT}`);
  console.log(`Admin em http://localhost:${PORT}/admin.html`);
});
