import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' }));

const STORE_DIR = path.join(__dirname, 'store');
if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() }); // используем память вместо диска

// POST /send
app.post('/send', upload.single('file'), (req, res) => {
    const expires = parseInt(req.body.expires);

    if (isNaN(expires) || expires <= 0) {
        return res.status(400).json({ error: 'Invalid expires value' });
    }

    if (expires > 604800000) { // 7 дней в миллисекундах
        return res.status(400).json({ error: 'Expires too large. Max allowed is 7 days.' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname);
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + expires;
    const filename = `${expiresAt}_${uniqueId}${ext}`;
    const filepath = path.join(STORE_DIR, filename);

    fs.writeFile(filepath, req.file.buffer, err => {
        if (err) {
            console.error('Ошибка при сохранении файла:', err);
            return res.status(500).json({ error: 'Failed to save file' });
        }

        res.json({ filename });
    });
});

// GET /get/:filename
app.get('/get/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(STORE_DIR, filename);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filepath);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
