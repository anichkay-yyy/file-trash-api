import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_DIR = path.join(__dirname, 'store');

function cleanupExpiredFiles() {
    const now = Date.now();

    fs.readdir(STORE_DIR, (err, files) => {
        if (err) {
            console.error('Ошибка чтения директории:', err);
            return;
        }

        files.forEach(filename => {
            // Формат: <expires>_<uniqueId>.<ext>
            const underscoreIndex = filename.indexOf('_');
            if (underscoreIndex === -1) {
                // Если формат не соответствует — пропускаем
                return;
            }

            const expiresStr = filename.substring(0, underscoreIndex);
            const expires = parseInt(expiresStr);

            if (isNaN(expires)) {
                // Некорректный формат времени — пропускаем
                return;
            }

            if (now >= expires) {
                // Время истекло — удаляем файл
                const filepath = path.join(STORE_DIR, filename);
                fs.unlink(filepath, err => {
                    if (err) {
                        console.error(`Ошибка при удалении файла ${filename}:`, err);
                    }
                });
            }
        });
    });
}

cleanupExpiredFiles();
